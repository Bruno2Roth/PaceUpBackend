import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import config from '../configs/environment.js';
import logger from '../configs/logger.js';
import { rateLimitMiddleware } from '../api/middlewares/rateLimitMiddleware.js';
import { notFoundMiddleware, errorMiddleware } from '../api/middlewares/index.js';
import apiRoutes from '../routes/index.js';

const createApp = async () => {
  const app = express();

  // Dynamic import for optional middlewares (graceful if not installed)
  try {
    const helmetModule = await import('helmet');
    const helmet = helmetModule?.default || helmetModule;
    app.use(helmet());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Optional dependency "helmet" not found. Continuing without helmet. Run `npm install` to add it.');
  }

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: config.api.corsOrigin,
      credentials: true,
    }),
  );

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  app.use(morgan(config.logging.format || 'combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));

  app.use(rateLimitMiddleware);

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use(`/api/${config.apiVersion}`, apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export default createApp;
