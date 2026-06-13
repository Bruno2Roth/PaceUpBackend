import { Router } from 'express';
import RecommendationController from '../api/controllers/RecommendationController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new RecommendationController();

router.get('/clubs', authMiddleware, controller.getClubs.bind(controller));
router.get('/challenges', authMiddleware, controller.getChallenges.bind(controller));
router.get('/routes', authMiddleware, controller.getRoutes.bind(controller));
router.get('/events', authMiddleware, controller.getEvents.bind(controller));

export default router;
