import http from 'http';
import createApp from './app/app.js';
import config from './configs/environment.js';
import logger from './configs/logger.js';
import db from './configs/database.js';
import initSockets from './sockets/index.js';

const start = async () => {
  try {
    const app = await createApp();
    const server = http.createServer(app);

    // Initialize DB pool
    db.initialize();

    // Initialize sockets (prepared)
    const io = initSockets(server, { corsOrigin: config.api.corsOrigin });

    server.listen(config.port, () => {
      logger.info(`Pace Up API listening on port ${config.port}`);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
