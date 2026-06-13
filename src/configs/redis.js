import { createClient } from 'redis';
import config from './environment.js';

class RedisCache {
  constructor() {
    this.client = null;
  }

  async initialize() {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              return false;
            }
            return Math.min(retries * 200, 1000);
          },
        },
      });

      this.client.on('error', () => {});

      this.client.on('connect', () => {
        console.log('Redis connected');
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Redis not available, caching disabled');
      this.client = null;
    }
    return this.client;
  }

  async get(key) {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, expiration = null) {
    if (!this.client) return false;
    try {
      const serialized = JSON.stringify(value);
      if (expiration) {
        await this.client.setEx(key, expiration, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async clear() {
    if (!this.client) return false;
    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('Redis CLEAR error:', error);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export const redis = new RedisCache();

export default redis;
