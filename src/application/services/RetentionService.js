import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import NotificationService from './NotificationService.js';
import { sendEmail } from '../../configs/email.js';
import EmailTemplateRepository from '../../data/repositories/EmailTemplateRepository.js';
import logger from '../../configs/logger.js';

export class RetentionService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.userRepository = new UserRepository();
    this.activityRepository = new ActivityRepository();
    this.notificationService = new NotificationService();
    this.templateRepository = new EmailTemplateRepository();
  }

  async detectInactiveUsers(daysInactive = 14) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysInactive);

    const inactiveUsers = await this.userRepository.findMany('last_activity_at IS NULL OR last_activity_at < $1', [cutoff], 100, 0);
    return inactiveUsers;
  }

  async detectChurnRisk(daysSinceLastActivity = 21) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSinceLastActivity);

    const activeUsers = await this.subscriptionRepository.findAllActiveUserIds();
    const atRisk = [];

    for (const userId of activeUsers) {
      try {
        const user = await this.userRepository.findNonDeletedById(userId);
        if (!user) continue;
        if (!user.last_activity_at || new Date(user.last_activity_at) < cutoff) {
          atRisk.push(user);
        }
      } catch {}
    }

    return atRisk;
  }

  async detectCanceledPremium(daysSinceCancel = 3) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSinceCancel);

    const canceled = await this.subscriptionRepository.findMany("status = 'canceled' AND updated_at < $1", [cutoff], 100, 0);
    return canceled;
  }

  async runRetentionCampaign() {
    const inactive = await this.detectInactiveUsers(14);
    let sent = 0;

    for (const user of inactive) {
      try {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'inactivity_alert',
          title: 'Te extrañamos',
          message: 'Hace tiempo que no entrenas. ¡Vuelve a PaceUp!',
          metadata: { days_inactive: 14 },
        });

        const template = await this.templateRepository.findByKey('inactivity_alert');
        if (template && user.email) {
          const html = template.body_html;
          await sendEmail({ to: user.email, subject: template.subject, html });
        }
        sent++;
      } catch (err) {
        logger.error('Retention notification failed:', err.message);
      }
    }

    return { campaign: 'retention', notified: sent, total: inactive.length };
  }

  async runWinbackCampaign() {
    const canceled = await this.detectCanceledPremium(7);
    let sent = 0;

    for (const sub of canceled) {
      try {
        const user = await this.userRepository.findNonDeletedById(sub.user_id);
        if (!user) continue;

        await this.notificationService.createNotification({
          userId: user.id,
          type: 'winback_offer',
          title: 'Vuelve a PaceUp',
          message: 'Te esperamos con una oferta especial. ¡Recupera tu suscripción Premium!',
          metadata: { subscription_id: sub.id },
        });

        const template = await this.templateRepository.findByKey('winback_offer');
        if (template && user.email) {
          const html = template.body_html;
          await sendEmail({ to: user.email, subject: template.subject, html });
        }
        sent++;
      } catch (err) {
        logger.error('Winback notification failed:', err.message);
      }
    }

    return { campaign: 'winback', notified: sent, total: canceled.length };
  }
}
export default RetentionService;
