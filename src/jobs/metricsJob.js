import MetricsService from '../application/services/MetricsService.js';
import SubscriptionRepository from '../data/repositories/SubscriptionRepository.js';
import logger from '../configs/logger.js';

export const metricsJob = async () => {
  try {
    logger.info('Starting daily metrics calculation job...');
    const subscriptionRepository = new SubscriptionRepository();
    const metricsService = new MetricsService();

    const premiumUsers = await subscriptionRepository.findAllActiveUserIds();

    let totalCalculated = 0;
    for (const userId of premiumUsers) {
      await metricsService.calculateMetrics(userId);
      totalCalculated++;
    }

    logger.info(`Metrics job completed. Calculated metrics for ${totalCalculated} users.`);
  } catch (error) {
    logger.error('Metrics job failed:', error);
  }
};

export default metricsJob;
