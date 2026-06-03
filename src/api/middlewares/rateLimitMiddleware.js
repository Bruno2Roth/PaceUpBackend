import rateLimit from 'express-rate-limit';
import config from '../../configs/environment.js';

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  max: config.rateLimiter.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

export const createRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests
  message: 'Too many requests, please try again later',
});

export default rateLimitMiddleware;
