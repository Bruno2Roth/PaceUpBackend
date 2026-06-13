import RetentionService from '../application/services/RetentionService.js';
import logger from '../configs/logger.js';

export async function winbackJob() {
  const service = new RetentionService();
  try {
    const result = await service.runWinbackCampaign();
    logger.info('Winback campaign completed', result);
    return result;
  } catch (err) {
    logger.error('Winback campaign failed:', err.message);
    throw err;
  }
}

export default winbackJob;
