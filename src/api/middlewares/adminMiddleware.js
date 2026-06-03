import logger from '../../configs/logger.js';

export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.userRole !== 'ADMIN') {
      logger.warn(`Unauthorized admin access attempt by user ${req.userId}`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

export default adminMiddleware;
