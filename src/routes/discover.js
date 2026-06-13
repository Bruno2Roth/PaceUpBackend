import { Router } from 'express';
import DiscoveryController from '../api/controllers/DiscoveryController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new DiscoveryController();

router.get('/users', authMiddleware, controller.getUsers.bind(controller));
router.get('/routes', authMiddleware, controller.getRoutes.bind(controller));
router.get('/events', authMiddleware, controller.getEvents.bind(controller));
router.get('/clubs', authMiddleware, controller.getClubs.bind(controller));

export default router;
