import { Router } from 'express';
import BillingController from '../api/controllers/BillingController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new BillingController();

router.post('/stripe/checkout', authMiddleware, controller.stripeCheckout);
router.post('/stripe/webhook', controller.stripeWebhook);
router.get('/stripe/status', authMiddleware, controller.stripeStatus);

router.post('/mercadopago/checkout', authMiddleware, controller.mercadopagoCheckout);
router.post('/mercadopago/webhook', controller.mercadopagoWebhook);
router.get('/mercadopago/status', authMiddleware, controller.mercadopagoStatus);

router.get('/history', authMiddleware, controller.getHistory);
router.get('/invoices', authMiddleware, controller.getInvoices);
router.get('/invoices/:id', authMiddleware, controller.getInvoiceById);

export default router;
