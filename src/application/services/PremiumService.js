import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';

const PREMIUM_FEATURES = {
  metrics: 'Métricas avanzadas',
  ai_coach: 'Coach IA',
  training_plans: 'Planes de entrenamiento',
  heatmaps: 'Heatmaps',
  advanced_routes: 'Rutas avanzadas',
};

export class PremiumService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
  }

  async isPremium(userId) {
    const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
    return !!subscription;
  }

  async hasFeature(userId, featureCode) {
    const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
    if (!subscription) return false;

    const features = subscription.features;
    return Array.isArray(features) ? features.includes(featureCode) : false;
  }

  async requirePremium(userId, featureCode = null) {
    const subscription = await this.subscriptionRepository.findActiveByUserId(userId);

    if (!subscription) {
      const err = new Error('Premium subscription required');
      err.status = 403;
      err.code = 'PREMIUM_REQUIRED';
      throw err;
    }

    if (featureCode) {
      const features = subscription.features;
      const hasFeature = Array.isArray(features) ? features.includes(featureCode) : false;
      if (!hasFeature) {
        const err = new Error(`Feature "${PREMIUM_FEATURES[featureCode] || featureCode}" requires premium subscription`);
        err.status = 403;
        err.code = 'FEATURE_NOT_AVAILABLE';
        throw err;
      }
    }

    return subscription;
  }

  async getUserSubscription(userId) {
    const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
    if (!subscription) {
      return { is_premium: false, plan: null };
    }

    return {
      is_premium: true,
      plan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        code: subscription.plan_code,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
      },
    };
  }

  async getUserSubscriptionHistory(userId) {
    return this.subscriptionRepository.findByUserId(userId);
  }
}

export default PremiumService;
