import { Router } from 'express';
import RouteController from '../api/controllers/RouteController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';

const router = Router();
const controller = new RouteController();

router.post('/', authMiddleware, controller.createRoute.bind(controller));
router.get('/', controller.getPublicRoutes.bind(controller));
router.get('/search', controller.searchRoutes.bind(controller));
router.get('/popular', controller.getPopularRoutes.bind(controller));
router.get('/nearby', controller.getNearbyRoutes.bind(controller));
router.get('/favorites', authMiddleware, controller.getFavoriteRoutes.bind(controller));
router.get('/user/:id', controller.getUserRoutes.bind(controller));
router.get('/:id', controller.getRoute.bind(controller));
router.put('/:id', authMiddleware, controller.updateRoute.bind(controller));
router.delete('/:id', authMiddleware, controller.deleteRoute.bind(controller));
router.post('/:id/favorite', authMiddleware, controller.toggleFavorite.bind(controller));

export default router;
