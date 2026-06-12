import { Router } from 'express';
import NotificationController from '../api/controllers/NotificationController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new NotificationController();

router.get('/', authMiddleware, controller.getNotifications.bind(controller));
router.get('/unread-count', authMiddleware, controller.getUnreadCount.bind(controller));
router.patch('/read-all', authMiddleware, controller.markAllAsRead.bind(controller));
router.patch('/:id/read', authMiddleware, controller.markAsRead.bind(controller));

export default router;
