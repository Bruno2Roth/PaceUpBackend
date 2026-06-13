import { Router } from 'express';
import ReferralController from '../api/controllers/ReferralController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new ReferralController();

router.get('/me', authMiddleware, controller.getMyReferrals);
router.post('/invite', authMiddleware, controller.invite);
router.get('/history', authMiddleware, controller.getHistory);

export default router;
