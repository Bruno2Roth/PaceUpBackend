import { Router } from 'express';
import CouponController from '../api/controllers/CouponController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new CouponController();

router.post('/validate', authMiddleware, controller.validate);
router.post('/redeem', authMiddleware, controller.redeem);

export default router;
