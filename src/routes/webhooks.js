import { Router } from 'express';
import WebhookController from '../api/controllers/WebhookController.js';

const router = Router();
const controller = new WebhookController();

router.post('/garmin', controller.handleWebhook.bind(controller, { params: { provider: 'garmin' } }));
router.post('/coros', controller.handleWebhook.bind(controller, { params: { provider: 'coros' } }));
router.post('/polar', controller.handleWebhook.bind(controller, { params: { provider: 'polar' } }));
router.post('/suunto', controller.handleWebhook.bind(controller, { params: { provider: 'suunto' } }));

export default router;
