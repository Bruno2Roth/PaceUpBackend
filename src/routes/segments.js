import { Router } from 'express';
import SegmentController from '../api/controllers/SegmentController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new SegmentController();

router.post('/', authMiddleware, controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', authMiddleware, controller.update.bind(controller));
router.delete('/:id', authMiddleware, controller.delete.bind(controller));
router.get('/:id/leaderboard', controller.getLeaderboard.bind(controller));
router.get('/:id/efforts', authMiddleware, controller.getEfforts.bind(controller));

export default router;
