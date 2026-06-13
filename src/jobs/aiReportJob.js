import AiCoachService from '../application/services/AiCoachService.js';
import SubscriptionRepository from '../data/repositories/SubscriptionRepository.js';
import logger from '../configs/logger.js';

export const aiReportJob = async () => {
  try {
    logger.info('Starting AI weekly report job...');
    const subscriptionRepository = new SubscriptionRepository();
    const aiCoachService = new AiCoachService();

    const premiumUsers = await subscriptionRepository.findAllActiveUserIds();

    let totalReports = 0;
    for (const userId of premiumUsers) {
      await aiCoachService.getWeeklyReport(userId);
      totalReports++;
    }

    logger.info(`AI report job completed. Generated ${totalReports} weekly reports.`);
  } catch (error) {
    logger.error('AI report job failed:', error);
  }
};

export default aiReportJob;
