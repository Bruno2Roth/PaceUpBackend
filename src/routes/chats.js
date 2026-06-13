import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import ChatController from '../api/controllers/ChatController.js';

const router = Router();
const controller = new ChatController();

router.get('/', authMiddleware, controller.list.bind(controller));
router.get('/:id', authMiddleware, controller.getById.bind(controller));
router.post('/:id/messages', authMiddleware, controller.sendMessage.bind(controller));

export default router;
