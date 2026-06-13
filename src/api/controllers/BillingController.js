import StripeService from '../../application/services/StripeService.js';
import MercadoPagoService from '../../application/services/MercadoPagoService.js';
import BillingService from '../../application/services/BillingService.js';

export class BillingController {
  constructor() {
    this.stripeService = new StripeService();
    this.mercadopagoService = new MercadoPagoService();
    this.billingService = new BillingService();
  }

  stripeCheckout = async (req, res, next) => {
    try {
      const { planCode } = req.body;
      if (!planCode) return res.status(400).json({ error: 'planCode is required' });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await this.stripeService.createCheckoutSession(
        req.userId, planCode,
        req.body.successUrl || `${baseUrl}/billing/success`,
        req.body.cancelUrl || `${baseUrl}/billing/cancel`
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  stripeWebhook = async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'];
      const result = await this.stripeService.handleWebhook(req.body, sig);
      res.json(result);
    } catch (err) { next(err); }
  };

  stripeStatus = async (req, res, next) => {
    try {
      const status = await this.stripeService.getStatus();
      res.json(status);
    } catch (err) { next(err); }
  };

  mercadopagoCheckout = async (req, res, next) => {
    try {
      const { planCode } = req.body;
      if (!planCode) return res.status(400).json({ error: 'planCode is required' });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await this.mercadopagoService.createCheckout(
        req.userId, planCode,
        req.body.successUrl || `${baseUrl}/billing/success`,
        req.body.cancelUrl || `${baseUrl}/billing/cancel`
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  mercadopagoWebhook = async (req, res, next) => {
    try {
      const result = await this.mercadopagoService.handleWebhook(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  mercadopagoStatus = async (req, res, next) => {
    try {
      const status = await this.mercadopagoService.getStatus();
      res.json(status);
    } catch (err) { next(err); }
  };

  getHistory = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const history = await this.billingService.getHistory(req.userId, page, limit);
      res.json({ history });
    } catch (err) { next(err); }
  };

  getInvoices = async (req, res, next) => {
    try {
      const invoices = await this.billingService.getInvoices(req.userId);
      res.json({ invoices });
    } catch (err) { next(err); }
  };

  getInvoiceById = async (req, res, next) => {
    try {
      const invoice = await this.billingService.getInvoiceById(req.params.id, req.userId);
      res.json(invoice);
    } catch (err) { next(err); }
  };
}
export default BillingController;
