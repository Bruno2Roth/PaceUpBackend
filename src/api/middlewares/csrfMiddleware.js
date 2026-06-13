import crypto from 'crypto';
import logger from '../../configs/logger.js';

const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const csrfMiddleware = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  const token = req.headers[CSRF_HEADER];
  const expected = req.session?.csrfToken;

  if (!token || !expected || token !== expected) {
    logger.warn('CSRF validation failed', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: req.userId,
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

export const generateCsrfToken = (req, res, next) => {
  if (!req.session) req.session = {};
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.setHeader('x-csrf-token', req.session.csrfToken);
  next();
};

export default { csrfMiddleware, generateCsrfToken };
