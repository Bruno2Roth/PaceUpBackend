import http from 'http';
import net from 'net';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import createApp from './app/app.js';
import config from './configs/environment.js';
import logger from './configs/logger.js';
import db from './configs/database.js';
import redis from './configs/redis.js';
import { initializeEmail } from './configs/email.js';
import { initializeQueues, closeAllQueues } from './configs/queue.js';
import { registerWorkers } from './configs/queueWorkers.js';
import initSockets from './sockets/index.js';
import BackupService from './application/services/BackupService.js';

const start = async () => {
  try {
    const app = await createApp();
    const server = http.createServer(app);

    db.initialize();
    await redis.initialize();

    await initializeEmail();

    initializeQueues();
    registerWorkers();

    const io = initSockets(server, { corsOrigin: config.api.corsOrigin });

    try {
      const addr = config.redis.host;
      const port = config.redis.port;
      await new Promise((resolve, reject) => {
        const sock = net.createConnection(port, addr, () => {
          sock.destroy();
          resolve();
        });
        sock.on('error', () => {
          sock.destroy();
          reject(new Error('Redis unreachable'));
        });
        sock.setTimeout(1000, () => {
          sock.destroy();
          reject(new Error('Redis timeout'));
        });
      });
      const pubClient = createClient({
        url: `redis://${addr}:${port}`,
        socket: { reconnectStrategy: () => false },
      });
      pubClient.on('error', () => {});
      const subClient = pubClient.duplicate();
      subClient.on('error', () => {});
      await Promise.all([
        pubClient.connect().catch(() => {}),
        subClient.connect().catch(() => {}),
      ]);
      if (pubClient.isOpen && subClient.isOpen) {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.IO Redis adapter initialized');
      } else {
        logger.warn('Socket.IO Redis adapter not available (single instance mode): connection failed');
      }
    } catch (err) {
      logger.warn('Socket.IO Redis adapter not available (single instance mode)');
    }

    const tryListen = (port) => {
      server.listen(port, () => {
        config.port = port;
        logger.info(`Pace Up API listening on port ${port}`);
      });
    };

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${config.port} in use, trying ${config.port + 1}...`);
        config.port++;
        tryListen(config.port);
        return;
      }
      logger.fatal('Server error', err);
      process.exit(1);
    });

    tryListen(config.port);

    const backupService = new BackupService();
    const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;
    const backupTimer = setInterval(async () => {
      try {
        await backupService.runScheduledBackups();
        await backupService.cleanOldBackups();
      } catch (err) {
        logger.error('Scheduled backup failed:', err.message);
      }
    }, BACKUP_INTERVAL);
    backupTimer.unref();

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      clearInterval(backupTimer);
      await closeAllQueues();
      await redis.close();
      await db.close();
      io?.close();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
      logger.fatal('Uncaught exception', err);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      const msg = reason?.message || String(reason);
      if (msg.includes('ECONNREFUSED') && msg.includes('6379')) {
        return;
      }
      logger.error('Unhandled rejection', reason);
    });
  } catch (error) {
    logger.fatal('Failed to start server', error);
    process.exit(1);
  }
};

start();
