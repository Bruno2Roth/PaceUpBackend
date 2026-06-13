import HeatmapService from '../application/services/HeatmapService.js';
import SubscriptionRepository from '../data/repositories/SubscriptionRepository.js';
import logger from '../configs/logger.js';

export const heatmapJob = async () => {
  try {
    logger.info('Starting heatmap generation job...');
    const subscriptionRepository = new SubscriptionRepository();
    const heatmapService = new HeatmapService();

    const premiumUsers = await subscriptionRepository.findAllActiveUserIds();

    let totalGenerated = 0;
    for (const userId of premiumUsers) {
      await heatmapService.generatePersonalHeatmap(userId);
      totalGenerated++;
    }

    logger.info(`Heatmap job completed. Generated heatmaps for ${totalGenerated} users.`);
  } catch (error) {
    logger.error('Heatmap job failed:', error);
  }
};

export default heatmapJob;
