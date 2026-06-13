import TrainingPlanService from '../application/services/TrainingPlanService.js';
import SubscriptionRepository from '../data/repositories/SubscriptionRepository.js';
import logger from '../configs/logger.js';

export const trainingPlanJob = async () => {
  try {
    logger.info('Starting training plan adaptation job...');
    const subscriptionRepository = new SubscriptionRepository();
    const trainingPlanService = new TrainingPlanService();

    const premiumUsers = await subscriptionRepository.findAllActiveUserIds();

    let totalAdapted = 0;
    for (const userId of premiumUsers) {
      const plan = await trainingPlanService.getCurrentPlan(userId);
      if (plan && !plan.is_paused) {
        await trainingPlanService.recalculatePlan(plan.id, userId);
        totalAdapted++;
      }
    }

    logger.info(`Training plan job completed. Adapted ${totalAdapted} plans.`);
  } catch (error) {
    logger.error('Training plan job failed:', error);
  }
};

export default trainingPlanJob;
