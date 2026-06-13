import { Router } from 'express';
import SubscriptionController from '../api/controllers/SubscriptionController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new SubscriptionController();

router.get('/plans', controller.getPlans);
router.get('/me', authMiddleware, controller.getMySubscription);
router.post('/subscribe', authMiddleware, controller.subscribe);
router.post('/cancel', authMiddleware, controller.cancel);
router.post('/reactivate', authMiddleware, controller.reactivate);
router.post('/start-trial', authMiddleware, controller.startTrial);
router.get('/trial-status', authMiddleware, controller.getTrialStatus);
router.get('/history', authMiddleware, controller.getHistory);

export default router;
