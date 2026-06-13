import { Router } from 'express';
import MarketplaceController from '../api/controllers/MarketplaceController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new MarketplaceController();

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', authMiddleware, controller.create.bind(controller));

export default router;
