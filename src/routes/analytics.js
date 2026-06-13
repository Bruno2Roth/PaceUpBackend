import { Router } from 'express';
import AnalyticsController from '../api/controllers/AnalyticsController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import adminMiddleware from '../api/middlewares/adminMiddleware.js';

const router = Router();
const controller = new AnalyticsController();

router.get('/dau', authMiddleware, adminMiddleware, controller.getDAU.bind(controller));
router.get('/wau', authMiddleware, adminMiddleware, controller.getWAU.bind(controller));
router.get('/mau', authMiddleware, adminMiddleware, controller.getMAU.bind(controller));
router.get('/cohort-retention', authMiddleware, adminMiddleware, controller.getCohortRetention.bind(controller));
router.get('/engagement', authMiddleware, controller.getEngagementScore.bind(controller));

export default router;
