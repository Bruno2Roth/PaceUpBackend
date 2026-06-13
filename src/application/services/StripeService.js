import config from '../../configs/environment.js';
import logger from '../../configs/logger.js';
import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';

let stripe = null;
try {
  stripe = (await import('stripe'))(config.stripe.secretKey);
} catch {
  logger.warn('Stripe not configured');
}

export class StripeService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new BillingInvoiceRepository();
  }

  async createCheckoutSession(userId, planCode, successUrl, cancelUrl) {
    if (!stripe) throw new Error('Stripe not configured');

    const prices = {
      premium_monthly: { price: config.stripe.premiumMonthlyPriceId, mode: 'subscription' },
      premium_yearly: { price: config.stripe.premiumYearlyPriceId, mode: 'subscription' },
      coach_plus: { price: config.stripe.coachPlusPriceId, mode: 'subscription' },
    };

    const priceConfig = prices[planCode];
    if (!priceConfig) {
      const err = new Error('Invalid plan code');
      err.status = 400;
      throw err;
    }

    const session = await stripe.checkout.sessions.create({
      mode: priceConfig.mode,
      line_items: [{ price: priceConfig.price, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: { user_id: userId, plan_code: planCode },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(rawBody, signature) {
    if (!stripe) throw new Error('Stripe not configured');

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed:', err.message);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const planCode = session.metadata.plan_code;

        const planPrices = { price_premium_monthly: 'premium_monthly', price_premium_yearly: 'premium_yearly', price_coach_plus: 'coach_plus' };
        const resolved = planCode || planPrices[session.line_items?.data?.[0]?.price?.id] || 'premium_monthly';

        const existing = await this.subscriptionRepository.findActiveByUserId(userId);
        if (existing) {
          await this.subscriptionRepository.update(existing.id, {
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: 'active',
            cancel_at_period_end: false,
          });
        }

        if (session.invoice) {
          await this.invoiceRepository.create({
            user_id: userId,
            subscription_id: existing?.id,
            invoice_number: `STRIPE-${session.id.slice(-12)}`,
            amount: session.amount_total / 100,
            currency: (session.currency || 'usd').toUpperCase(),
            status: 'paid',
            payment_method: 'stripe',
            provider: 'stripe',
            provider_invoice_id: session.invoice,
            paid_at: new Date(),
            metadata: JSON.stringify({ session_id: session.id, customer: session.customer }),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const subRec = await this.subscriptionRepository.findOne('stripe_subscription_id = $1', [sub.id]);
        if (subRec) {
          await this.subscriptionRepository.update(subRec.id, {
            status: sub.status === 'active' ? 'active' : 'canceled',
            current_period_end: new Date(sub.current_period_end * 1000),
            cancel_at_period_end: sub.cancel_at_period_end,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const deleted = event.data.object;
        const subRec = await this.subscriptionRepository.findOne('stripe_subscription_id = $1', [deleted.id]);
        if (subRec) {
          await this.subscriptionRepository.update(subRec.id, {
            status: 'expired',
            cancel_at_period_end: false,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object;
        logger.warn('Stripe payment failed:', { customer: inv.customer, invoice: inv.id });
        break;
      }
    }

    return { received: true };
  }

  async getStatus() {
    return { configured: !!stripe };
  }

  static async getClient() {
    return stripe;
  }
}
export default StripeService;
