import redis from '../../configs/redis.js';
import logger from '../../configs/logger.js';

const WINDOW_MS = 60000;

const limits = {
  global: { points: 100, windowMs: 900000 },
  auth: { points: 10, windowMs: 60000 },
  likes: { points: 30, windowMs: 60000 },
  comments: { points: 10, windowMs: 60000 },
  search: { points: 60, windowMs: 60000 },
  integrations: { points: 20, windowMs: 60000 },
};

export class RateLimiterService {
  constructor() {
    this.localBuckets = new Map();
    this.useRedis = true;
  }

  getLimiter(name) {
    return limits[name] || limits.global;
  }

  async checkRateLimit(key, limiterName = 'global') {
    const limiter = this.getLimiter(limiterName);

    if (this.useRedis) {
      try {
        return await this._redisCheck(key, limiter.points, Math.floor(limiter.windowMs / 1000));
      } catch {
        this.useRedis = false;
        logger.warn('Redis rate limit fallback to local');
      }
    }
    return this._localCheck(key, limiter.points, limiter.windowMs);
  }

  async _redisCheck(key, maxPoints, windowSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}`;

    const multi = redis.client.multi();
    multi.zRemRangeByScore(windowKey, 0, now - windowSeconds);
    multi.zAdd(windowKey, { score: now, value: `${now}:${Math.random()}` });
    multi.zCard(windowKey);
    multi.expire(windowKey, windowSeconds);
    const results = await multi.exec();

    const count = results[2][1];
    const remaining = Math.max(0, maxPoints - count);
    const reset = now + windowSeconds;

    return {
      allowed: count <= maxPoints,
      remaining,
      reset,
      total: maxPoints,
    };
  }

  _localCheck(key, maxPoints, windowMs) {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / windowMs)}`;

    if (!this.localBuckets.has(bucketKey)) {
      this.localBuckets.set(bucketKey, { count: 0, resetAt: now + windowMs });
      if (this.localBuckets.size > 10000) {
        const cutoff = now - 120000;
        for (const [k, v] of this.localBuckets) {
          if (v.resetAt < cutoff) this.localBuckets.delete(k);
        }
      }
    }

    const bucket = this.localBuckets.get(bucketKey);
    bucket.count++;

    return {
      allowed: bucket.count <= maxPoints,
      remaining: Math.max(0, maxPoints - bucket.count),
      reset: Math.floor(bucket.resetAt / 1000),
      total: maxPoints,
    };
  }

  async consume(key, limiterName = 'global') {
    const result = await this.checkRateLimit(key, limiterName);
    if (!result.allowed) {
      const err = new Error('Too many requests');
      err.status = 429;
      err.rateLimit = result;
      throw err;
    }
    return result;
  }
}

export default RateLimiterService;
