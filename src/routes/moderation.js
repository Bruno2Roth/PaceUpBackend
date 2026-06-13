import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import ModerationController from '../api/controllers/ModerationController.js';

const router = Router();
const controller = new ModerationController();

router.use(authMiddleware);

router.post('/reports', controller.createReport.bind(controller));

export default router;
