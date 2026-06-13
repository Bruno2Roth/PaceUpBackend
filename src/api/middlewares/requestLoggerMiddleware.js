import logger from '../../configs/logger.js';

export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, correlationId } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      correlationId,
      method,
      url: originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || null,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', meta);
    } else {
      logger.info('HTTP Request', meta);
    }
  });

  next();
};

export default requestLoggerMiddleware;
