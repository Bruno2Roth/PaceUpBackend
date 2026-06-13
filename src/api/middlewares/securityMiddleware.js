import rateLimit from 'express-rate-limit';
import logger from '../../configs/logger.js';
import ModerationService from '../../application/services/ModerationService.js';

const requestCounts = new Map();
const SUSPICIOUS_THRESHOLD = 100;
const SUSPICIOUS_WINDOW = 10000;
const BLOCK_DURATION = 300000;

const floodRequestCounts = new Map();

export const commentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many comments, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

export const likeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many likes, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

export const securityMiddleware = async (req, res, next) => {
  try {
    const modService = new ModerationService();
    if (req.userId) {
      const restricted = await modService.isUserRestricted(req.userId);
      if (restricted.restricted) {
        const msg = restricted.reason === 'banned' ? 'Account banned' : 'Account suspended';
        return res.status(403).json({ error: msg, details: restricted });
      }
    }
  } catch {}

  next();
};

export const abuseDetectionMiddleware = (req, res, next) => {
  const key = req.ip || req.connection?.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, firstRequest: now, blockedUntil: 0 });
    return next();
  }

  const record = requestCounts.get(key);

  if (record.blockedUntil > now) {
    logger.warn('Blocked abusive request', { ip: key });
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  if (now - record.firstRequest > SUSPICIOUS_WINDOW) {
    record.count = 1;
    record.firstRequest = now;
    return next();
  }

  record.count++;

  if (record.count > SUSPICIOUS_THRESHOLD) {
    record.blockedUntil = now + BLOCK_DURATION;
    logger.warn('Abuse detected, blocking IP', { ip: key, count: record.count });
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  if (requestCounts.size > 100000) {
    const cutoff = now - 600000;
    for (const [k, v] of requestCounts) {
      if (v.blockedUntil < cutoff && v.firstRequest < cutoff) {
        requestCounts.delete(k);
      }
    }
  }

  next();
};

export const sessionSecurityMiddleware = (req, res, next) => {
  if (req.userId) {
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;

    req.userSession = { userId: req.userId, role: req.userRole, ip, userAgent };
  }
  next();
};

export const antiFloodMiddleware = (windowMs = 2000, maxRequests = 5) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    if (!floodRequestCounts.has(key)) {
      floodRequestCounts.set(key, { count: 1, start: now });
      return next();
    }

    const record = floodRequestCounts.get(key);

    if (now - record.start > windowMs) {
      record.count = 1;
      record.start = now;
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      logger.warn('Anti-flood triggered', { ip: req.ip, path: req.path });
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }

    next();
  };
};

export default { securityMiddleware, abuseDetectionMiddleware, sessionSecurityMiddleware, commentRateLimit, likeRateLimit, antiFloodMiddleware };
