import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import SubscriptionPlanRepository from '../../data/repositories/SubscriptionPlanRepository.js';
import SubscriptionHistoryRepository from '../../data/repositories/SubscriptionHistoryRepository.js';
import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import NotificationService from './NotificationService.js';
import AchievementService from './AchievementService.js';
import XpService from './XpService.js';
import config from '../../configs/environment.js';

const PLANS = {
  free: { name: 'Free', code: 'free', priceMonthly: 0, priceYearly: 0, features: ['activities', 'feed', 'clubs', 'challenges', 'rankings'] },
  premium_monthly: { name: 'Premium Mensual', code: 'premium_monthly', priceMonthly: 9.99, priceYearly: 99.99, features: ['metrics', 'ai_coach', 'training_plans', 'heatmaps', 'advanced_routes'] },
  premium_yearly: { name: 'Premium Anual', code: 'premium_yearly', priceMonthly: 8.33, priceYearly: 99.99, features: ['metrics', 'ai_coach', 'training_plans', 'heatmaps', 'advanced_routes', 'priority_support'] },
  coach_plus: { name: 'Coach+', code: 'coach_plus', priceMonthly: 14.99, priceYearly: 149.99, features: ['metrics', 'ai_coach', 'training_plans', 'heatmaps', 'advanced_routes', 'personalized_plans', 'advanced_analytics', 'priority_support'] },
};

export class SubscriptionService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.planRepository = new SubscriptionPlanRepository();
    this.historyRepository = new SubscriptionHistoryRepository();
    this.invoiceRepository = new BillingInvoiceRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
    this.achievementService = new AchievementService();
    this.xpService = new XpService();
  }

  async getPlans() {
    const dbPlans = await this.planRepository.findActive();
    return dbPlans.length > 0 ? dbPlans : Object.values(PLANS);
  }

  async getUserSubscription(userId) {
    const sub = await this.subscriptionRepository.findActiveByUserId(userId);
    if (!sub) return { is_premium: false, plan: 'free', features: PLANS.free.features };
    return {
      is_premium: true,
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        code: sub.plan_code,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
      },
      features: sub.features || [],
    };
  }

  async subscribe(userId, planCode, paymentProvider, paymentData = {}) {
    const plan = await this.planRepository.findByCode(planCode);
    if (!plan) {
      const err = new Error('Invalid plan code');
      err.status = 400;
      throw err;
    }

    const existing = await this.subscriptionRepository.findActiveByUserId(userId);
    if (existing) {
      const err = new Error('User already has an active subscription');
      err.status = 400;
      throw err;
    }

    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const sub = await this.subscriptionRepository.create({
      user_id: userId,
      plan_id: plan.id,
      status: 'active',
      current_period_start: start,
      current_period_end: end,
      cancel_at_period_end: false,
    });

    await this.historyRepository.create({
      user_id: userId,
      subscription_id: sub.id,
      plan_id: plan.id,
      event_type: 'subscribed',
      metadata: { plan: planCode, provider: paymentProvider },
    });

    if (plan.price_monthly > 0) {
      const invoiceNumber = `INV-${Date.now()}-${userId.slice(0, 8)}`;
      await this.invoiceRepository.create({
        user_id: userId,
        subscription_id: sub.id,
        invoice_number: invoiceNumber,
        amount: plan.price_monthly,
        currency: plan.currency || 'USD',
        status: 'paid',
        payment_method: paymentProvider,
        provider: paymentProvider,
        paid_at: new Date(),
        due_at: end,
        lines: JSON.stringify([{ description: plan.name, amount: plan.price_monthly }]),
        metadata: JSON.stringify(paymentData),
      });
    }

    await this._awardPremiumAchievements(userId);

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'subscription_renewed',
        title: 'Bienvenido a Premium',
        message: `Ya disfrutas de PaceUp ${plan.name}`,
        metadata: { plan: planCode },
      });
    } catch {}

    return sub;
  }

  async cancel(userId) {
    const sub = await this.subscriptionRepository.findActiveByUserId(userId);
    if (!sub) {
      const err = new Error('No active subscription found');
      err.status = 404;
      throw err;
    }

    const updated = await this.subscriptionRepository.update(sub.id, {
      cancel_at_period_end: true,
    });

    await this.historyRepository.create({
      user_id: userId,
      subscription_id: sub.id,
      plan_id: sub.plan_id,
      event_type: 'canceled',
      metadata: { cancel_at_period_end: true },
    });

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'subscription_cancelled',
        title: 'Suscripción cancelada',
        message: 'Tu suscripción se cancelará al final del período actual.',
        metadata: { current_period_end: sub.current_period_end },
      });
    } catch {}

    return updated;
  }

  async reactivate(userId) {
    const subs = await this.subscriptionRepository.findByUserId(userId);
    const canceled = subs.find(s => s.status === 'active' && s.cancel_at_period_end);
    if (!canceled) {
      const err = new Error('No canceled subscription to reactivate');
      err.status = 400;
      throw err;
    }

    const updated = await this.subscriptionRepository.update(canceled.id, {
      cancel_at_period_end: false,
    });

    await this.historyRepository.create({
      user_id: userId,
      subscription_id: canceled.id,
      plan_id: canceled.plan_id,
      event_type: 'reactivated',
      metadata: {},
    });

    return updated;
  }

  async getHistory(userId) {
    return this.historyRepository.findByUserId(userId);
  }

  async startTrial(userId, planCode, durationDays = 7) {
    const existing = await this.subscriptionRepository.findActiveByUserId(userId);
    if (existing) {
      const err = new Error('User already has an active subscription');
      err.status = 400;
      throw err;
    }

    const user = await this.userRepository.findNonDeletedById(userId);
    if (user.trial_started_at) {
      const err = new Error('Trial already used');
      err.status = 400;
      throw err;
    }

    const plan = await this.planRepository.findByCode(planCode);
    if (!plan) {
      const err = new Error('Invalid plan code');
      err.status = 400;
      throw err;
    }

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    const sub = await this.subscriptionRepository.create({
      user_id: userId,
      plan_id: plan.id,
      status: 'trial',
      current_period_start: start,
      current_period_end: end,
      trial_end: end,
      cancel_at_period_end: true,
    });

    await this.userRepository.update(userId, { trial_started_at: start });

    await this.historyRepository.create({
      user_id: userId,
      subscription_id: sub.id,
      plan_id: plan.id,
      event_type: 'trial_started',
      metadata: { duration_days: durationDays, plan: planCode },
    });

    return sub;
  }

  async getTrialStatus(userId) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user.trial_started_at) return { trial_used: false, trial_days_remaining: 0 };
    const started = new Date(user.trial_started_at);
    const now = new Date();
    const elapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 7 - elapsed);
    return { trial_used: true, trial_started_at: user.trial_started_at, trial_days_remaining: remaining, trial_expired: remaining <= 0 };
  }

  _calculateStreak(sortedDates) {
    if (!sortedDates.length) return { current: 0, max: 0 };
    let max = 1, current = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const recent = new Date(sortedDates[0]);
    const diff = Math.floor((today - recent) / 86400000);
    if (diff <= 1) current = 1;
    let temp = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const d = Math.floor((new Date(sortedDates[i - 1]) - new Date(sortedDates[i])) / 86400000);
      if (d === 1) { temp++; if (i === 1) current = temp; }
      else { max = Math.max(max, temp); temp = 1; }
    }
    max = Math.max(max, temp);
    if (diff <= 1) current = Math.max(current, 1);
    return { current, max };
  }

  async _awardPremiumAchievements(userId) {
    try {
      const defs = [
        { type: 'premium_first_month', title: 'Primer mes Premium', description: 'Disfruta de tu primer mes como usuario Premium', icon_url: '/achievements/premium_month.png' },
        { type: 'premium_100_activities', title: '100 actividades Premium', description: 'Completa 100 actividades siendo Premium', icon_url: '/achievements/premium_100.png' },
        { type: 'premium_one_year', title: '1 año de suscripción', description: 'Un año completo como usuario Premium', icon_url: '/achievements/premium_year.png' },
        { type: 'premium_coach', title: 'Coach avanzado', description: 'Usa el Coach IA por primera vez', icon_url: '/achievements/premium_coach.png' },
      ];
      const AchievementRepository = (await import('../../data/repositories/AchievementRepository.js')).default;
      const achRepo = new AchievementRepository();
      const existing = await achRepo.findByUserId(userId);
      const existingTypes = new Set(existing.map(a => a.achievement_type));
      for (const def of defs) {
        if (!existingTypes.has(def.type)) {
          const ach = await achRepo.create({ user_id: userId, achievement_type: def.type, title: def.title, description: def.description, icon_url: def.icon_url, metadata: {} });
          await this.xpService.awardXp(userId, 'achievement_earned', { achievementId: ach.id });
          try { await this.notificationService.notifyAchievement(userId, ach); } catch {}
        }
      }
    } catch {}
  }
}
export default SubscriptionService;
