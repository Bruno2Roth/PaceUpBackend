import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import MetricsController from '../api/controllers/MetricsController.js';

const router = Router();
const controller = new MetricsController();

router.use(authMiddleware);
router.use(premiumMiddleware('metrics'));

router.get('/me', controller.getMyMetrics.bind(controller));
router.get('/history', controller.getMetricsHistory.bind(controller));
router.get('/load', controller.getTrainingLoad.bind(controller));
router.get('/recovery', controller.getRecoveryStatus.bind(controller));
router.get('/fitness', controller.getFitnessTrend.bind(controller));

export default router;
