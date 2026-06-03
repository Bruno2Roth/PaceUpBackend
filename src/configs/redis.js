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

    this.client = createClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    await this.client.connect();
    return this.client;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, expiration = null) {
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
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async clear() {
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
