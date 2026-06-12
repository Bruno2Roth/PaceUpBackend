import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import XpController from '../api/controllers/XpController.js';

const router = Router();
const controller = new XpController();

router.get('/status', authMiddleware, controller.getXpStatus.bind(controller));
router.get('/history', authMiddleware, controller.getXpHistory.bind(controller));

export default router;
