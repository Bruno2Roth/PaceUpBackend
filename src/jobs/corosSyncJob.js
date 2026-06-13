import IntegrationSyncService from '../application/services/IntegrationSyncService.js';
import IntegrationRepository from '../data/repositories/IntegrationRepository.js';
import logger from '../configs/logger.js';

export const corosSyncJob = async () => {
  try {
    logger.info('Starting COROS auto-sync job...');
    const integrationRepository = new IntegrationRepository();
    const syncService = new IntegrationSyncService();
    const connections = await integrationRepository.findAllConnected('coros');
    let synced = 0;
    for (const conn of connections) {
      try {
        await syncService.sync('coros', conn.user_id, 'automatic');
        synced++;
      } catch (error) {
        logger.error(`COROS sync failed for user ${conn.user_id}: ${error.message}`);
      }
    }
    logger.info(`COROS sync job completed. Synced ${synced}/${connections.length} users.`);
  } catch (error) {
    logger.error('COROS sync job failed:', error);
  }
};

export default corosSyncJob;
