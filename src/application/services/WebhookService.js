import crypto from 'crypto';
import config from '../../configs/environment.js';
import { WebhookEventRepository } from '../../data/repositories/IntegrationRepository.js';
import ActivityService from './ActivityService.js';
import MetricsService from './MetricsService.js';
import logger from '../../configs/logger.js';

const WEBHOOK_SECRETS = {
  garmin: process.env.GARMIN_WEBHOOK_SECRET || '',
  coros: process.env.COROS_WEBHOOK_SECRET || '',
  polar: process.env.POLAR_WEBHOOK_SECRET || '',
  suunto: process.env.SUUNTO_WEBHOOK_SECRET || '',
};

export class WebhookService {
  constructor() {
    this.webhookEventRepository = new WebhookEventRepository();
    this.activityService = new ActivityService();
    this.metricsService = new MetricsService();
  }

  async processWebhook(provider, eventType, payload, signature) {
    const event = await this.webhookEventRepository.create({
      provider,
      event_type: eventType,
      payload: JSON.stringify(payload),
      signature,
      status: 'received',
      created_at: new Date(),
    });

    try {
      const signatureValid = this.validateSignature(provider, payload, signature);

      await this.webhookEventRepository.update(event.id, {
        signature_valid: signatureValid,
        status: 'processing',
      });

      if (!signatureValid) {
        logger.warn(`Invalid webhook signature from ${provider} for event ${eventType}`);
        await this.webhookEventRepository.update(event.id, {
          status: 'failed',
          error_message: 'Invalid signature',
        });
        const err = new Error('Invalid signature');
        err.status = 401;
        throw err;
      }

      await this.handleEvent(provider, eventType, payload);

      await this.webhookEventRepository.update(event.id, {
        status: 'processed',
        processed_at: new Date(),
      });
    } catch (error) {
      await this.webhookEventRepository.update(event.id, {
        status: 'failed',
        error_message: error.message,
      });
      throw error;
    }

    return event;
  }

  validateSignature(provider, payload, signature) {
    const secret = WEBHOOK_SECRETS[provider];
    if (!secret) return true;
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const expected = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
  }

  async handleEvent(provider, eventType, payload) {
    switch (eventType) {
      case 'activity.new':
      case 'activity.created':
        await this.handleNewActivity(provider, payload);
        break;
      case 'activity.updated':
        await this.handleUpdatedActivity(provider, payload);
        break;
      case 'activity.deleted':
        await this.handleDeletedActivity(provider, payload);
        break;
      case 'metrics.updated':
        await this.handleMetricsUpdated(provider, payload);
        break;
      default:
        logger.info(`Unhandled webhook event type: ${eventType} from ${provider}`);
    }
  }

  async handleNewActivity(provider, payload) {
    const userId = payload.user_id;
    const activityData = payload.activity || payload;
    if (!userId || !activityData) return;
    await this.activityService.importActivities(userId, [{
      ...activityData,
      source: provider,
      source_id: activityData.id?.toString(),
    }]);
  }

  async handleUpdatedActivity(provider, payload) {
    const userId = payload.user_id;
    const activityData = payload.activity || payload;
    if (!userId || !activityData?.id) return;
    const activities = await this.activityService.getActivities({
      requesterId: userId,
      userId,
      limit: 1,
    });
    const existing = activities.find(a => a.source === provider && a.source_id === activityData.id.toString());
    if (existing) {
      await this.activityService.updateActivity(existing.id, userId, activityData);
    }
  }

  async handleDeletedActivity(provider, payload) {
    const userId = payload.user_id;
    const activityId = payload.activity_id?.toString() || payload.id?.toString();
    if (!userId || !activityId) return;
    const activities = await this.activityService.getActivities({
      requesterId: userId,
      userId,
      limit: 50,
    });
    const existing = activities.find(a => a.source === provider && a.source_id === activityId);
    if (existing) {
      await this.activityService.deleteActivity(existing.id, userId);
    }
  }

  async handleMetricsUpdated(provider, payload) {
    const userId = payload.user_id;
    if (!userId) return;
    await this.metricsService.calculateMetrics(userId);
  }
}

export default WebhookService;
