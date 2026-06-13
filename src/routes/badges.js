import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import BadgeController from '../api/controllers/BadgeController.js';

const router = Router();
const controller = new BadgeController();

router.get('/', authMiddleware, controller.getMyBadges.bind(controller));

export default router;
