import AchievementService from '../application/services/AchievementService.js';
import UserRepository from '../data/repositories/UserRepository.js';
import logger from '../configs/logger.js';

export const achievementJob = async () => {
  try {
    logger.info('Starting achievement evaluation job...');
    const userRepository = new UserRepository();
    const achievementService = new AchievementService();

    const activeUsers = await userRepository.findActiveUsers(100, 0);

    let totalAwarded = 0;
    for (const user of activeUsers) {
      const awarded = await achievementService.evaluateAndAward(user.id);
      totalAwarded += awarded.length;
    }

    logger.info(`Achievement job completed. Awarded ${totalAwarded} achievements across ${activeUsers.length} users.`);
  } catch (error) {
    logger.error('Achievement job failed:', error);
  }
};

export default achievementJob;
