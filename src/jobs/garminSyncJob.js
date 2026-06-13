import IntegrationSyncService from '../application/services/IntegrationSyncService.js';
import IntegrationRepository from '../data/repositories/IntegrationRepository.js';
import logger from '../configs/logger.js';

export const garminSyncJob = async () => {
  try {
    logger.info('Starting Garmin auto-sync job...');
    const integrationRepository = new IntegrationRepository();
    const syncService = new IntegrationSyncService();
    const connections = await integrationRepository.findAllConnected('garmin');
    let synced = 0;
    for (const conn of connections) {
      try {
        await syncService.sync('garmin', conn.user_id, 'automatic');
        synced++;
      } catch (error) {
        logger.error(`Garmin sync failed for user ${conn.user_id}: ${error.message}`);
      }
    }
    logger.info(`Garmin sync job completed. Synced ${synced}/${connections.length} users.`);
  } catch (error) {
    logger.error('Garmin sync job failed:', error);
  }
};

export default garminSyncJob;
