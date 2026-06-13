import IntegrationSyncService from '../application/services/IntegrationSyncService.js';
import IntegrationRepository from '../data/repositories/IntegrationRepository.js';
import logger from '../configs/logger.js';

export const suuntoSyncJob = async () => {
  try {
    logger.info('Starting Suunto auto-sync job...');
    const integrationRepository = new IntegrationRepository();
    const syncService = new IntegrationSyncService();
    const connections = await integrationRepository.findAllConnected('suunto');
    let synced = 0;
    for (const conn of connections) {
      try {
        await syncService.sync('suunto', conn.user_id, 'automatic');
        synced++;
      } catch (error) {
        logger.error(`Suunto sync failed for user ${conn.user_id}: ${error.message}`);
      }
    }
    logger.info(`Suunto sync job completed. Synced ${synced}/${connections.length} users.`);
  } catch (error) {
    logger.error('Suunto sync job failed:', error);
  }
};

export default suuntoSyncJob;
