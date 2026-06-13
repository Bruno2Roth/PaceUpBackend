import IntegrationRepository, { SyncLogRepository } from '../../data/repositories/IntegrationRepository.js';
import GarminService from '../../integrations/garmin/GarminService.js';
import CorosService from '../../integrations/coros/CorosService.js';
import PolarService from '../../integrations/polar/PolarService.js';
import SuuntoService from '../../integrations/suunto/SuuntoService.js';
import AppleHealthService from '../../integrations/apple/AppleHealthService.js';
import HealthConnectService from '../../integrations/healthconnect/HealthConnectService.js';
import ActivityService from './ActivityService.js';
import MetricsService from './MetricsService.js';
import NotificationService from './NotificationService.js';
import redis from '../../configs/redis.js';
import logger from '../../configs/logger.js';

const SYNC_CACHE_PREFIX = 'sync:';
const SYNC_CACHE_TTL = 900;
const STATUS_CACHE_PREFIX = 'int_status:';
const STATUS_CACHE_TTL = 300;

const PROVIDER_SERVICES = {
  garmin: GarminService,
  coros: CorosService,
  polar: PolarService,
  suunto: SuuntoService,
};

export class IntegrationSyncService {
  constructor() {
    this.integrationRepository = new IntegrationRepository();
    this.syncLogRepository = new SyncLogRepository();
    this.activityService = new ActivityService();
    this.metricsService = new MetricsService();
    this.notificationService = new NotificationService();
    this.serviceInstances = {};
  }

  getProviderService(provider) {
    if (!this.serviceInstances[provider]) {
      const ServiceClass = PROVIDER_SERVICES[provider];
      if (!ServiceClass) {
        const err = new Error(`Unsupported provider: ${provider}`);
        err.status = 400;
        throw err;
      }
      this.serviceInstances[provider] = new ServiceClass();
    }
    return this.serviceInstances[provider];
  }

  async getAuthUrl(provider, state) {
    const service = this.getProviderService(provider);
    return service.getAuthorizationUrl(state);
  }

  async handleCallback(provider, userId, code) {
    const service = this.getProviderService(provider);
    const tokenData = await service.exchangeCodeForToken(code);
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    let providerUsername = tokenData.provider_username;
    try {
      if (service.fetchUserProfile) {
        const profile = await service.fetchUserProfile(tokenData.access_token);
        providerUsername = profile?.username || profile?.displayName || providerUsername;
      }
    } catch {}

    await this.integrationRepository.upsertConnection(userId, provider, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      scope: tokenData.scope,
      provider_user_id: tokenData.provider_user_id,
      provider_username: providerUsername || provider,
      is_connected: true,
    });

    await this.clearStatusCache(userId);

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'integration_connected',
        title: 'Integración conectada',
        message: `Tu cuenta de ${provider} ha sido vinculada exitosamente.`,
        metadata: { provider },
      });
    } catch {}

    return { provider, connected: true };
  }

  async disconnect(provider, userId) {
    await this.integrationRepository.disconnect(userId, provider);
    await this.clearStatusCache(userId);

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'integration_disconnected',
        title: 'Integración desconectada',
        message: `Tu cuenta de ${provider} ha sido desconectada.`,
        metadata: { provider },
      });
    } catch {}

    return { provider, connected: false };
  }

  async sync(provider, userId, syncType = 'manual') {
    const connection = await this.integrationRepository.findByUserAndProvider(userId, provider);
    if (!connection || !connection.is_connected) {
      const err = new Error(`${provider} not connected`);
      err.status = 400;
      throw err;
    }

    const syncLog = await this.syncLogRepository.create({
      user_id: userId,
      provider,
      sync_type: syncType,
      status: 'running',
      started_at: new Date(),
    });

    try {
      const service = this.getProviderService(provider);
      let accessToken = connection.access_token;

      if (connection.refresh_token && this.isTokenExpiring(connection.expires_at)) {
        const refreshed = await service.refreshAccessToken(connection.refresh_token);
        accessToken = refreshed.access_token;
        const expiresAt = refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : null;
        await this.integrationRepository.updateTokens(userId, provider, {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || connection.refresh_token,
          expires_at: expiresAt,
          token_type: refreshed.token_type || connection.token_type,
        });
      }

      const lastSyncLog = await this.syncLogRepository.findLastSync(userId, provider);
      const startDate = lastSyncLog
        ? new Date(new Date(lastSyncLog.created_at).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      let activities = [];
      try {
        activities = await service.fetchActivities(accessToken, startDate, endDate);
      } catch (error) {
        logger.warn(`Failed to fetch activities from ${provider}: ${error.message}`);
      }

      if (!Array.isArray(activities)) activities = [];

      let imported = 0;
      let skipped = 0;

      for (const extActivity of activities) {
        const converted = service.convertActivity(extActivity);
        if (!converted) {
          skipped++;
          continue;
        }

        try {
          converted.user_id = userId;
          const result = await this.activityService.importActivities(userId, [converted]);
          if (result && result.length > 0) imported++;
          else skipped++;
        } catch {
          skipped++;
        }
      }

      await this.integrationRepository.updateLastSync(userId, provider);

      try {
        await this.metricsService.calculateMetrics(userId);
      } catch {}

      const result = {
        activities_found: activities.length,
        activities_imported: imported,
        activities_skipped: skipped,
      };

      await this.syncLogRepository.update(syncLog.id, {
        status: 'completed',
        completed_at: new Date(),
        activities_found: result.activities_found,
        activities_imported: result.activities_imported,
        activities_skipped: result.activities_skipped,
      });

      await this.clearSyncCache(userId, provider);

      try {
        await this.notificationService.createNotification({
          userId,
          type: 'sync_completed',
          title: 'Sincronización completada',
          message: `Se importaron ${imported} actividades de ${provider}.`,
          metadata: { provider, imported, total: activities.length },
        });
      } catch {}

      return result;
    } catch (error) {
      await this.syncLogRepository.update(syncLog.id, {
        status: 'failed',
        completed_at: new Date(),
        error_message: error.message,
      });

      try {
        await this.notificationService.createNotification({
          userId,
          type: 'sync_failed',
          title: 'Error de sincronización',
          message: `No se pudo sincronizar ${provider}: ${error.message}`,
          metadata: { provider, error: error.message },
        });
      } catch {}

      throw error;
    }
  }

  async getStatus(userId) {
    const cacheKey = `${STATUS_CACHE_PREFIX}${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const connections = await this.integrationRepository.findByUserId(userId);
    const result = [];

    for (const conn of connections) {
      const recentLogs = await this.syncLogRepository.findRecentByUserAndProvider(userId, conn.provider, 1);
      result.push({
        provider: conn.provider,
        connected: conn.is_connected,
        username: conn.provider_username,
        last_sync_at: conn.last_sync_at,
        sync_enabled: conn.sync_enabled,
        last_status: recentLogs[0]?.status || null,
        last_error: recentLogs[0]?.error_message || null,
        last_sync_time: recentLogs[0]?.completed_at || null,
      });
    }

    await redis.set(cacheKey, result, STATUS_CACHE_TTL);
    return result;
  }

  async importAppleHealth(userId, payload) {
    const appleService = new AppleHealthService();
    const result = await appleService.importData(userId, payload);

    for (const item of result.items) {
      if (item.type === 'activity') {
        await this.activityService.importActivities(userId, [item]);
      }
    }

    return {
      activities_imported: result.activities_imported,
      metrics_imported: result.metrics_imported,
    };
  }

  async importHealthConnect(userId, payload) {
    const hcService = new HealthConnectService();
    const result = await hcService.importData(userId, payload);

    for (const item of result.items) {
      if (item.type === 'activity') {
        await this.activityService.importActivities(userId, [item]);
      }
    }

    return {
      activities_imported: result.activities_imported,
      metrics_imported: result.metrics_imported,
    };
  }

  isTokenExpiring(expiresAt) {
    if (!expiresAt) return true;
    const expiry = new Date(expiresAt);
    return expiry.getTime() - Date.now() < 10 * 60 * 1000;
  }

  async clearStatusCache(userId) {
    await redis.delete(`${STATUS_CACHE_PREFIX}${userId}`);
  }

  async clearSyncCache(userId, provider) {
    await redis.delete(`${SYNC_CACHE_PREFIX}${userId}:${provider}`);
  }
}

export default IntegrationSyncService;
