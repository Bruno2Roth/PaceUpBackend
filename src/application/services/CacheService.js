import redis from '../../configs/redis.js';
import logger from '../../configs/logger.js';

const DEFAULT_TTL = 300;

const TTL_CONFIG = {
  'profile': 300,
  'rankings': 120,
  'metrics': 60,
  'feed': 60,
  'clubs': 300,
  'challenges': 300,
  'routes': 300,
  'heatmap': 600,
  'training_plans': 300,
  'like_counts': 300,
};

export class CacheService {
  constructor() {
    this.hitCount = 0;
    this.missCount = 0;
    this.localCache = new Map();
  }

  _ttl(entity) {
    return TTL_CONFIG[entity] || DEFAULT_TTL;
  }

  _key(entity, ...parts) {
    return `cache:${entity}:${parts.join(':')}`;
  }

  async get(entity, ...parts) {
    const key = this._key(entity, ...parts);

    const local = this.localCache.get(key);
    if (local && local.expiresAt > Date.now()) {
      this.hitCount++;
      return local.value;
    }
    if (local) this.localCache.delete(key);

    try {
      const value = await redis.get(key);
      if (value !== null) {
        this.hitCount++;
        this.localCache.set(key, { value, expiresAt: Date.now() + (this._ttl(entity) * 1000) });
        return value;
      }
    } catch {}

    this.missCount++;
    return null;
  }

  async set(entity, data, ...parts) {
    const key = this._key(entity, ...parts);
    const ttl = this._ttl(entity);

    try {
      await redis.set(key, data, ttl);
      this.localCache.set(key, { value: data, expiresAt: Date.now() + (ttl * 1000) });
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(entity, ...parts) {
    const pattern = parts.length > 0 ? this._key(entity, ...parts) : `cache:${entity}:*`;

    try {
      if (parts.length > 0) {
        await redis.delete(pattern);
        this.localCache.delete(pattern);
      } else {
        let cursor = '0';
        do {
          const reply = await redis.client.scan(cursor, { match: pattern, count: 100 });
          cursor = reply.cursor;
          const keys = reply.keys;
          if (keys.length > 0) {
            await redis.client.del(keys);
            keys.forEach(k => this.localCache.delete(k));
          }
        } while (cursor !== '0');
      }
    } catch (error) {
      logger.error('Cache invalidate error:', error);
    }
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? Math.round((this.hitCount / total) * 10000) / 100 : 0,
    };
  }
}

export default CacheService;
