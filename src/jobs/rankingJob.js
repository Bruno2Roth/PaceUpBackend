import RankingRepository from '../data/repositories/RankingRepository.js';
import logger from '../configs/logger.js';

export const rankingJob = async () => {
  try {
    logger.info('Starting ranking recalculation job...');
    const rankingRepository = new RankingRepository();

    await rankingRepository.clearCache();

    logger.info('Ranking caches cleared and ready for recalculation.');
  } catch (error) {
    logger.error('Ranking job failed:', error);
  }
};

export default rankingJob;
