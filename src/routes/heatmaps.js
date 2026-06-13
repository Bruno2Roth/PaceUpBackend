import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import HeatmapController from '../api/controllers/HeatmapController.js';

const router = Router();
const controller = new HeatmapController();

router.use(authMiddleware);
router.use(premiumMiddleware('heatmaps'));

router.get('/me', controller.getPersonalHeatmap.bind(controller));
router.get('/club/:clubId', controller.getClubHeatmap.bind(controller));
router.get('/global', controller.getGlobalHeatmap.bind(controller));
router.post('/generate', controller.generateHeatmap.bind(controller));

export default router;
