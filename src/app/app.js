import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import config from '../configs/environment.js';
import logger from '../configs/logger.js';
import { rateLimitMiddleware } from '../api/middlewares/rateLimitMiddleware.js';
import { correlationIdMiddleware } from '../api/middlewares/correlationIdMiddleware.js';
import { requestLoggerMiddleware } from '../api/middlewares/requestLoggerMiddleware.js';
import { notFoundMiddleware, errorMiddleware } from '../api/middlewares/index.js';
import apiRoutes from '../routes/index.js';
import PrometheusService from '../application/services/PrometheusService.js';
import { recordHttpRequest } from '../application/services/PrometheusService.js';

const createApp = async () => {
  const app = express();
  const prometheusService = new PrometheusService();

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use(cors({
    origin: config.api.corsOrigin,
    credentials: true,
  }));

  app.use(correlationIdMiddleware);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  app.use(morgan(config.logging.format || 'combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));

  app.use(requestLoggerMiddleware);

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, Date.now() - start);
    });
    next();
  });

  app.use(rateLimitMiddleware);

  app.get('/health', (req, res) => res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  app.get('/metrics', async (req, res) => {
    try {
      const metrics = await prometheusService.getMetrics();
      res.setHeader('Content-Type', prometheusService.getContentType());
      res.status(200).send(metrics);
    } catch (error) {
      logger.error('Metrics error:', error);
      res.status(500).json({ error: 'Metrics unavailable' });
    }
  });

  app.use(`/api/${config.apiVersion}`, apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export default createApp;
