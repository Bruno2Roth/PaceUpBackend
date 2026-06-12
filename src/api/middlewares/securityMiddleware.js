import rateLimit from 'express-rate-limit';

const userRequestCounts = new Map();

export const commentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many comments, please slow down' },
  keyGenerator: (req) => `comment:${req.userId}`,
});

export const likeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many likes, please slow down' },
  keyGenerator: (req) => `like:${req.userId}`,
});

export const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

export const antiFloodMiddleware = (windowMs = 5000, maxRequests = 3) => {
  const counts = new Map();

  return (req, res, next) => {
    const key = `${req.userId}:${req.originalUrl}`;
    const now = Date.now();

    if (!counts.has(key)) {
      counts.set(key, { count: 1, start: now });
      return next();
    }

    const entry = counts.get(key);
    if (now - entry.start > windowMs) {
      counts.set(key, { count: 1, start: now });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please wait' });
    }

    next();
  };
};

export default { commentRateLimit, likeRateLimit, sanitizeText, antiFloodMiddleware };
