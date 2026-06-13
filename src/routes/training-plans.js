import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import TrainingPlanController from '../api/controllers/TrainingPlanController.js';

const router = Router();
const controller = new TrainingPlanController();

router.use(authMiddleware);
router.use(premiumMiddleware('training_plans'));

router.post('/', controller.createPlan.bind(controller));
router.get('/current', controller.getCurrentPlan.bind(controller));
router.get('/:id', controller.getPlan.bind(controller));
router.patch('/:id', controller.updatePlan.bind(controller));
router.delete('/:id', controller.deletePlan.bind(controller));
router.post('/:id/pause', controller.pausePlan.bind(controller));
router.post('/:id/resume', controller.resumePlan.bind(controller));
router.post('/:id/recalculate', controller.recalculatePlan.bind(controller));
router.post('/sessions/:sessionId/complete', controller.completeSession.bind(controller));

export default router;
