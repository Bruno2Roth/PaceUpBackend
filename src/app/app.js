import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import config from '../configs/environment.js';
import logger from '../configs/logger.js';
import { rateLimitMiddleware } from '../api/middlewares/rateLimitMiddleware.js';
import { notFoundMiddleware, errorMiddleware } from '../api/middlewares/index.js';
import apiRoutes from '../routes/index.js';

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());

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
