import config from '../../configs/environment.js';
import logger from '../../configs/logger.js';
import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';

let mercadopago = null;
try {
  mercadopago = (await import('mercadopago')).default;
  mercadopago.configure({ access_token: config.mercadopago.accessToken });
} catch {
  logger.warn('Mercado Pago not configured');
}

export class MercadoPagoService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new BillingInvoiceRepository();
  }

  async createCheckout(userId, planCode, successUrl, cancelUrl) {
    if (!mercadopago) throw new Error('Mercado Pago not configured');

    const prices = {
      premium_monthly: 9.99,
      premium_yearly: 99.99,
      coach_plus: 14.99,
    };

    const amount = prices[planCode];
    if (!amount) {
      const err = new Error('Invalid plan code');
      err.status = 400;
      throw err;
    }

    const preference = await mercadopago.preferences.create({
      items: [{ title: `PaceUp ${planCode}`, quantity: 1, currency_id: 'USD', unit_price: amount }],
      payer: { id: userId },
      back_urls: { success: successUrl, failure: cancelUrl, pending: cancelUrl },
      auto_return: 'approved',
      metadata: { user_id: userId, plan_code: planCode },
      notification_url: `${config.apiBaseUrl}/api/${config.apiVersion}/billing/mercadopago/webhook`,
    });

    return { preferenceId: preference.body.id, initPoint: preference.body.init_point, sandboxInitPoint: preference.body.sandbox_init_point };
  }

  async handleWebhook(data) {
    if (!mercadopago) throw new Error('Mercado Pago not configured');

    if (data.type === 'payment') {
      const paymentId = data.data?.id;
      if (!paymentId) return { received: true };

      try {
        const payment = await mercadopago.payment.get(paymentId);
        const status = payment.body.status;
        const metadata = payment.body.metadata || {};
        const userId = metadata.user_id;
        const planCode = metadata.plan_code;

        if (status === 'approved' && userId) {
          const invoiceNumber = `MP-${paymentId}-${Date.now()}`;
          await this.invoiceRepository.create({
            user_id: userId,
            invoice_number: invoiceNumber,
            amount: payment.body.transaction_amount,
            currency: (payment.body.currency_id || 'USD').toUpperCase(),
            status: 'paid',
            payment_method: 'mercadopago',
            provider: 'mercadopago',
            provider_invoice_id: String(paymentId),
            paid_at: new Date(),
            metadata: JSON.stringify(payment.body),
          });
        } else if (status === 'rejected' || status === 'cancelled') {
          logger.warn('Mercado Pago payment failed:', { paymentId, status });
        }
      } catch (err) {
        logger.error('Mercado Pago webhook processing error:', err.message);
      }
    }

    return { received: true };
  }

  async getStatus() {
    return { configured: !!mercadopago };
  }
}
export default MercadoPagoService;
