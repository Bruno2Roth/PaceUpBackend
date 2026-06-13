import EmailTemplateRepository from '../../data/repositories/EmailTemplateRepository.js';
import { sendEmail } from '../../configs/email.js';
import logger from '../../configs/logger.js';

const TEMPLATE_KEYS = {
  welcome: 'welcome',
  email_verification: 'email_verification',
  password_recovery: 'password_recovery',
  purchase_complete: 'purchase_complete',
  subscription_renewed: 'subscription_renewed',
  subscription_cancelled: 'subscription_cancelled',
  payment_failed: 'payment_failed',
  trial_expiring: 'trial_expiring',
  coupon_received: 'coupon_received',
  referral_bonus: 'referral_bonus',
  inactivity_alert: 'inactivity_alert',
  winback_offer: 'winback_offer',
};

export class TransactionalEmailService {
  constructor() {
    this.templateRepository = new EmailTemplateRepository();
  }

  async sendTemplate(templateKey, to, variables = {}) {
    let template = await this.templateRepository.findByKey(templateKey);
    if (!template) {
      logger.warn(`Email template not found: ${templateKey}`);
      return { sent: false, error: 'Template not found' };
    }

    let html = template.body_html;
    let subject = template.subject;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      html = html.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    try {
      const result = await sendEmail({ to, subject, html });
      return { sent: true, messageId: result.messageId };
    } catch (err) {
      logger.error(`Failed to send ${templateKey} email:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  async sendWelcomeEmail(to, name) {
    return this.sendTemplate(TEMPLATE_KEYS.welcome, to, { name });
  }

  async sendVerificationEmail(to, name, verificationLink) {
    return this.sendTemplate(TEMPLATE_KEYS.email_verification, to, { name, verification_link: verificationLink });
  }

  async sendPasswordRecoveryEmail(to, name, recoveryLink) {
    return this.sendTemplate(TEMPLATE_KEYS.password_recovery, to, { name, recovery_link: recoveryLink });
  }

  async sendPurchaseCompleteEmail(to, name, planName, amount) {
    return this.sendTemplate(TEMPLATE_KEYS.purchase_complete, to, { name, plan_name: planName, amount: String(amount) });
  }

  async sendSubscriptionRenewedEmail(to, name, planName, nextBillingDate) {
    return this.sendTemplate(TEMPLATE_KEYS.subscription_renewed, to, { name, plan_name: planName, next_billing_date: nextBillingDate });
  }

  async sendSubscriptionCancelledEmail(to, name, planName, accessUntil) {
    return this.sendTemplate(TEMPLATE_KEYS.subscription_cancelled, to, { name, plan_name: planName, access_until: accessUntil });
  }

  async sendPaymentFailedEmail(to, name, planName, amount) {
    return this.sendTemplate(TEMPLATE_KEYS.payment_failed, to, { name, plan_name: planName, amount: String(amount) });
  }

  async sendTrialExpiringEmail(to, name, daysRemaining) {
    return this.sendTemplate(TEMPLATE_KEYS.trial_expiring, to, { name, days_remaining: String(daysRemaining) });
  }

  async sendCouponReceivedEmail(to, name, couponCode, discountDescription) {
    return this.sendTemplate(TEMPLATE_KEYS.coupon_received, to, { name, coupon_code: couponCode, discount_description: discountDescription });
  }

  async sendReferralBonusEmail(to, name, friendName, xpAmount) {
    return this.sendTemplate(TEMPLATE_KEYS.referral_bonus, to, { name, friend_name: friendName, xp_amount: String(xpAmount) });
  }
}
export default TransactionalEmailService;
