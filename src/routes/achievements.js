import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import AchievementController from '../api/controllers/AchievementController.js';

const router = Router();
const controller = new AchievementController();

router.get('/', authMiddleware, controller.getUserAchievements.bind(controller));
router.get('/count', authMiddleware, controller.getAchievementCount.bind(controller));

export default router;
