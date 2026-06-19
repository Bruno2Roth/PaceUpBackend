import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import TrainingWizardController from '../api/controllers/TrainingWizardController.js';

const router = Router();
const controller = new TrainingWizardController();

router.use(authMiddleware);
router.use(premiumMiddleware('training_plans'));

router.post('/start', controller.start.bind(controller));
router.post('/answer', controller.answer.bind(controller));
router.get('/current', controller.current.bind(controller));
router.post('/finish', controller.finish.bind(controller));
router.post('/generate-plan', controller.generatePlan.bind(controller));

export default router;
