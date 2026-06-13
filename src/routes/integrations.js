import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import IntegrationController from '../api/controllers/IntegrationController.js';

const router = Router();
const controller = new IntegrationController();

router.get('/', authMiddleware, controller.listIntegrations.bind(controller));

router.get('/garmin/auth', authMiddleware, controller.getAuthUrl.bind(controller, { params: { provider: 'garmin' } }));
router.get('/garmin/callback', controller.handleCallback.bind(controller, { params: { provider: 'garmin' } }));
router.post('/garmin/sync', authMiddleware, controller.sync.bind(controller, { params: { provider: 'garmin' } }));
router.delete('/garmin/disconnect', authMiddleware, controller.disconnect.bind(controller, { params: { provider: 'garmin' } }));
router.get('/garmin/status', authMiddleware, controller.getStatus.bind(controller, { params: { provider: 'garmin' } }));

router.get('/coros/auth', authMiddleware, controller.getAuthUrl.bind(controller, { params: { provider: 'coros' } }));
router.get('/coros/callback', controller.handleCallback.bind(controller, { params: { provider: 'coros' } }));
router.post('/coros/sync', authMiddleware, controller.sync.bind(controller, { params: { provider: 'coros' } }));
router.delete('/coros/disconnect', authMiddleware, controller.disconnect.bind(controller, { params: { provider: 'coros' } }));

router.get('/polar/auth', authMiddleware, controller.getAuthUrl.bind(controller, { params: { provider: 'polar' } }));
router.get('/polar/callback', controller.handleCallback.bind(controller, { params: { provider: 'polar' } }));
router.post('/polar/sync', authMiddleware, controller.sync.bind(controller, { params: { provider: 'polar' } }));
router.delete('/polar/disconnect', authMiddleware, controller.disconnect.bind(controller, { params: { provider: 'polar' } }));

router.get('/suunto/auth', authMiddleware, controller.getAuthUrl.bind(controller, { params: { provider: 'suunto' } }));
router.get('/suunto/callback', controller.handleCallback.bind(controller, { params: { provider: 'suunto' } }));
router.post('/suunto/sync', authMiddleware, controller.sync.bind(controller, { params: { provider: 'suunto' } }));
router.delete('/suunto/disconnect', authMiddleware, controller.disconnect.bind(controller, { params: { provider: 'suunto' } }));

router.post('/apple/import', authMiddleware, controller.importAppleHealth.bind(controller));
router.get('/apple/status', authMiddleware, controller.getAppleHealthStatus.bind(controller));

router.post('/health-connect/import', authMiddleware, controller.importHealthConnect.bind(controller));
router.get('/health-connect/status', authMiddleware, controller.getHealthConnectStatus.bind(controller));

export default router;
