import WebhookService from '../../application/services/WebhookService.js';

const PROVIDERS = ['garmin', 'coros', 'polar', 'suunto'];

export class WebhookController {
  constructor() {
    this.webhookService = new WebhookService();
  }

  async handleWebhook(req, res, next) {
    try {
      const { provider } = req.params;
      if (!PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }

      const eventType = req.headers['x-event-type']
        || req.headers['x-event-name']
        || req.headers['event-type']
        || 'activity.new';

      const signature = req.headers['x-signature']
        || req.headers['x-hub-signature']
        || req.headers['signature']
        || null;

      const result = await this.webhookService.processWebhook(provider, eventType, req.body, signature);
      return res.status(200).json({ received: true, event_id: result.id });
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }
}

export default WebhookController;
