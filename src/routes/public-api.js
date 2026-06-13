import { Router } from 'express';
import PublicApiController from '../api/controllers/PublicApiController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import publicApiMiddleware from '../api/middlewares/publicApiMiddleware.js';

const router = Router();
const controller = new PublicApiController();

router.post('/apps', authMiddleware, controller.registerApp.bind(controller));
router.get('/activities', publicApiMiddleware, controller.getActivities.bind(controller));
router.get('/profile', publicApiMiddleware, controller.getProfile.bind(controller));

export default router;
