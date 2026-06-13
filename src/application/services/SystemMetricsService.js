import dbPool from '../../configs/database.js';
import redis from '../../configs/redis.js';
import os from 'os';

const metrics = {
  requestsPerMinute: 0,
  requestCounters: { total: 0, byStatus: {}, byPath: {} },
  errors: 0,
  activeUsers: new Set(),
  jobsExecuted: 0,
  cacheHits: 0,
  cacheMisses: 0,
  latencyBuckets: { lt100: 0, lt300: 0, lt500: 0, lt1000: 0, gt1000: 0 },
  startTime: Date.now(),
  lastMinuteCounter: { count: 0, resetAt: Date.now() },
};

export const recordRequest = ({ statusCode, path, duration, userId }) => {
  metrics.requestCounters.total++;
  metrics.lastMinuteCounter.count++;

  if (!metrics.requestCounters.byStatus[statusCode]) {
    metrics.requestCounters.byStatus[statusCode] = 0;
  }
  metrics.requestCounters.byStatus[statusCode]++;

  if (!metrics.requestCounters.byPath[path]) {
    metrics.requestCounters.byPath[path] = 0;
  }
  metrics.requestCounters.byPath[path]++;

  if (statusCode >= 500) metrics.errors++;
  if (duration < 100) metrics.latencyBuckets.lt100++;
  else if (duration < 300) metrics.latencyBuckets.lt300++;
  else if (duration < 500) metrics.latencyBuckets.lt500++;
  else if (duration < 1000) metrics.latencyBuckets.lt1000++;
  else metrics.latencyBuckets.gt1000++;

  if (userId) metrics.activeUsers.add(userId);

  const now = Date.now();
  if (now - metrics.lastMinuteCounter.resetAt > 60000) {
    metrics.requestsPerMinute = metrics.lastMinuteCounter.count;
    metrics.lastMinuteCounter.count = 0;
    metrics.lastMinuteCounter.resetAt = now;
  }
};

export const recordCacheHit = () => { metrics.cacheHits++; };
export const recordCacheMiss = () => { metrics.cacheMisses++; };
export const recordJobExecution = () => { metrics.jobsExecuted++; };

export class SystemMetricsService {
  async getMetrics() {
    const dbStatus = await this.getDbStatus();
    const redisStatus = await this.getRedisStatus();
    const activeUsersCount = metrics.activeUsers.size;
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    const cacheTotal = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (metrics.cacheHits / cacheTotal) : 0;

    return {
      uptime,
      requests: {
        total: metrics.requestCounters.total,
        perMinute: metrics.requestsPerMinute,
        byStatus: metrics.requestCounters.byStatus,
        errors: metrics.errors,
      },
      latency: {
        lt100ms: metrics.latencyBuckets.lt100,
        lt300ms: metrics.latencyBuckets.lt300,
        lt500ms: metrics.latencyBuckets.lt500,
        lt1s: metrics.latencyBuckets.lt1000,
        gt1s: metrics.latencyBuckets.gt1000,
      },
      cache: {
        hits: metrics.cacheHits,
        misses: metrics.cacheMisses,
        hitRate: Math.round(cacheHitRate * 10000) / 100,
      },
      jobs: { executed: metrics.jobsExecuted },
      users: { active: activeUsersCount },
      database: dbStatus,
      redis: redisStatus,
      system: {
        memory: process.memoryUsage(),
        cpu: os.loadavg(),
        hostname: os.hostname(),
        platform: os.platform(),
      },
    };
  }

  async getDbStatus() {
    try {
      const pool = dbPool.getPool();
      const result = await pool.query('SELECT 1 as ok');
      const connResult = await pool.query('SELECT count(*)::int as total FROM pg_stat_activity WHERE state = $1', ['active']);
      return {
        status: 'healthy',
        activeConnections: connResult.rows[0]?.total || 0,
      };
    } catch {
      return { status: 'unhealthy' };
    }
  }

  async getRedisStatus() {
    try {
      await redis.set('health:ping', 'pong', 10);
      const val = await redis.get('health:ping');
      return { status: val === 'pong' ? 'healthy' : 'degraded' };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}

export default SystemMetricsService;
