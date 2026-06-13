import { Router } from 'express';
import EventController from '../api/controllers/EventController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new EventController();

router.post('/', authMiddleware, controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/:id/join', authMiddleware, controller.join.bind(controller));
router.delete('/:id/leave', authMiddleware, controller.leave.bind(controller));

export default router;
