import logger from '../../configs/logger.js';

export const notFoundMiddleware = (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);

  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.url,
  });
};

export default notFoundMiddleware;
