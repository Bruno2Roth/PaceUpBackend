import RetentionService from '../application/services/RetentionService.js';
import logger from '../configs/logger.js';

export async function retentionJob() {
  const service = new RetentionService();
  try {
    const result = await service.runRetentionCampaign();
    logger.info('Retention campaign completed', result);
    return result;
  } catch (err) {
    logger.error('Retention campaign failed:', err.message);
    throw err;
  }
}

export default retentionJob;
