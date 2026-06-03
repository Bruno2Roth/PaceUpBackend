import { Router } from 'express';
import RouteController from '../api/controllers/RouteController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new RouteController();

router.post('/', authMiddleware, controller.createRoute.bind(controller));
router.get('/', controller.getPublicRoutes.bind(controller));
router.get('/search', controller.searchRoutes.bind(controller));
router.get('/:id', controller.getRoute.bind(controller));
router.get('/user/:id', controller.getUserRoutes.bind(controller));
router.put('/:id', authMiddleware, controller.updateRoute.bind(controller));
router.delete('/:id', authMiddleware, controller.deleteRoute.bind(controller));

export default router;
