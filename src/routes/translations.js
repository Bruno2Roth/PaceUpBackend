import { Router } from 'express';
import TranslationController from '../api/controllers/TranslationController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import adminMiddleware from '../api/middlewares/adminMiddleware.js';

const router = Router();
const controller = new TranslationController();

router.get('/:locale', controller.getTranslations.bind(controller));
router.put('/:locale/:key', authMiddleware, adminMiddleware, controller.setTranslation.bind(controller));

export default router;
