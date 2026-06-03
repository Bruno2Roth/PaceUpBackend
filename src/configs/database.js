import pkg from 'pg';
import config from './environment.js';

const { Pool } = pkg;

class DatabasePool {
  constructor() {
    this.pool = null;
  }

  initialize() {
    if (this.pool) {
      return this.pool;
    }

    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      max: config.db.poolMax,
      min: config.db.poolMin,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    return this.pool;
  }

  getPool() {
    if (!this.pool) {
      this.initialize();
    }
    return this.pool;
  }

  async query(text, params) {
    const pool = this.getPool();
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (config.nodeEnv === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async queryOne(text, params) {
    const result = await this.query(text, params);
    return result.rows[0];
  }

  async queryMany(text, params) {
    const result = await this.query(text, params);
    return result.rows;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export const dbPool = new DatabasePool();

export const getDatabase = () => dbPool.getPool();

export default dbPool;
