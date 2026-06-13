import IntegrationSyncService from '../application/services/IntegrationSyncService.js';
import IntegrationRepository from '../data/repositories/IntegrationRepository.js';
import logger from '../configs/logger.js';

export const polarSyncJob = async () => {
  try {
    logger.info('Starting Polar auto-sync job...');
    const integrationRepository = new IntegrationRepository();
    const syncService = new IntegrationSyncService();
    const connections = await integrationRepository.findAllConnected('polar');
    let synced = 0;
    for (const conn of connections) {
      try {
        await syncService.sync('polar', conn.user_id, 'automatic');
        synced++;
      } catch (error) {
        logger.error(`Polar sync failed for user ${conn.user_id}: ${error.message}`);
      }
    }
    logger.info(`Polar sync job completed. Synced ${synced}/${connections.length} users.`);
  } catch (error) {
    logger.error('Polar sync job failed:', error);
  }
};

export default polarSyncJob;
