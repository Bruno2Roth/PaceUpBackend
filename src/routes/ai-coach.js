import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import AiCoachController from '../api/controllers/AiCoachController.js';

const router = Router();
const controller = new AiCoachController();

router.use(authMiddleware);
router.use(premiumMiddleware('ai_coach'));

router.get('/weekly-report', controller.getWeeklyReport.bind(controller));
router.get('/recommendations', controller.getRecommendations.bind(controller));
router.get('/insights', controller.getInsights.bind(controller));
router.post('/analyze', controller.analyzeActivity.bind(controller));

export default router;
