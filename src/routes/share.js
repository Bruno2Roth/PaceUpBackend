import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import ShareController from '../api/controllers/ShareController.js';

const router = Router();
const controller = new ShareController();

router.get('/activity/:token', controller.getShare.bind(controller));
router.post('/activity/:id/image', authMiddleware, controller.generateImage.bind(controller));

export default router;
