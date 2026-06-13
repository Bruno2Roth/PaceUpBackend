import IntegrationSyncService from '../../application/services/IntegrationSyncService.js';
import IntegrationRepository from '../../data/repositories/IntegrationRepository.js';
import { generateState } from '../../helpers/oauth2.js';

const INTEGRATION_PROVIDERS = ['garmin', 'coros', 'polar', 'suunto'];

export class IntegrationController {
  constructor() {
    this.integrationSyncService = new IntegrationSyncService();
    this.integrationRepository = new IntegrationRepository();
    this.oauthStates = {};
  }

  async listIntegrations(req, res, next) {
    try {
      const statuses = await this.integrationSyncService.getStatus(req.userId);
      return res.status(200).json({ integrations: statuses });
    } catch (error) {
      next(error);
    }
  }

  async getAuthUrl(req, res, next) {
    try {
      const { provider } = req.params;
      if (!INTEGRATION_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      const state = generateState();
      this.oauthStates[state] = { userId: req.userId, provider, createdAt: Date.now() };
      const url = await this.integrationSyncService.getAuthUrl(provider, state);
      return res.status(200).json({ url, state });
    } catch (error) {
      next(error);
    }
  }

  async handleCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.status(400).json({ error: `OAuth error: ${oauthError}` });
      }

      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      const stateData = this.oauthStates[state];
      if (!stateData) {
        return res.status(400).json({ error: 'Invalid or expired state parameter' });
      }

      const { userId } = stateData;
      delete this.oauthStates[state];

      const result = await this.integrationSyncService.handleCallback(provider, userId, code);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sync(req, res, next) {
    try {
      const { provider } = req.params;
      if (!INTEGRATION_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      const result = await this.integrationSyncService.sync(provider, req.userId, 'manual');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      if (!INTEGRATION_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      const result = await this.integrationSyncService.disconnect(provider, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const { provider } = req.params;
      if (!INTEGRATION_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      const conn = await this.integrationRepository.findByUserAndProvider(req.userId, provider);
      if (!conn) {
        return res.status(200).json({ provider, connected: false });
      }
      return res.status(200).json({
        provider: conn.provider,
        connected: conn.is_connected,
        username: conn.provider_username,
        last_sync_at: conn.last_sync_at,
        sync_enabled: conn.sync_enabled,
      });
    } catch (error) {
      next(error);
    }
  }

  async importAppleHealth(req, res, next) {
    try {
      const result = await this.integrationSyncService.importAppleHealth(req.userId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async importHealthConnect(req, res, next) {
    try {
      const result = await this.integrationSyncService.importHealthConnect(req.userId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAppleHealthStatus(req, res, next) {
    return res.status(200).json({
      available: true,
      supported_data: ['activities', 'distance', 'pace', 'heart_rate', 'calories'],
    });
  }

  async getHealthConnectStatus(req, res, next) {
    return res.status(200).json({
      available: true,
      supported_data: ['activities', 'distance', 'pace', 'heart_rate', 'calories'],
    });
  }

  cleanupStates() {
    const now = Date.now();
    for (const [state, data] of Object.entries(this.oauthStates)) {
      if (now - data.createdAt > 10 * 60 * 1000) {
        delete this.oauthStates[state];
      }
    }
  }
}

export default IntegrationController;
