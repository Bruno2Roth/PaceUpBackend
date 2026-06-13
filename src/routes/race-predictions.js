import { Router } from 'express';
import RacePredictionController from '../api/controllers/RacePredictionController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new RacePredictionController();

router.get('/', authMiddleware, controller.getPredictions.bind(controller));
router.post('/predict', authMiddleware, controller.predictDistance.bind(controller));
router.post('/simulate', authMiddleware, controller.simulateTraining.bind(controller));
router.get('/simulations', authMiddleware, controller.getSimulations.bind(controller));

export default router;
