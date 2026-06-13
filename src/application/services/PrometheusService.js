import promClient from 'prom-client';
import { recordRequest, recordCacheHit, recordCacheMiss } from './SystemMetricsService.js';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const redisOperationDuration = new promClient.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Redis operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

const jobsExecutedTotal = new promClient.Counter({
  name: 'jobs_executed_total',
  help: 'Total jobs executed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

const activeUsersGauge = new promClient.Gauge({
  name: 'active_users',
  help: 'Currently active users',
  registers: [register],
});

const cacheHitRate = new promClient.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate',
  registers: [register],
});

export const recordHttpRequest = (method, path, status, duration) => {
  httpRequestsTotal.inc({ method, path, status: String(status) });
  httpRequestDuration.observe({ method, path, status: String(status) }, duration / 1000);
  recordRequest({ statusCode: status, path, duration });
};

export const recordDbQuery = (operation, duration) => {
  dbQueryDuration.observe({ operation }, duration / 1000);
};

export const recordRedisOp = (operation, duration) => {
  redisOperationDuration.observe({ operation }, duration / 1000);
};

export const recordJobResult = (queue, status) => {
  jobsExecutedTotal.inc({ queue, status });
};

export const updateActiveUsers = (count) => {
  activeUsersGauge.set(count);
};

export class PrometheusService {
  constructor() {
    this.register = register;
  }

  async getMetrics() {
    return register.metrics();
  }

  getContentType() {
    return register.contentType;
  }

  recordRequest(method, path, status, duration) {
    recordHttpRequest(method, path, status, duration);
  }

  recordDbQuery(operation, duration) {
    recordDbQuery(operation, duration);
  }

  recordRedisOp(operation, duration) {
    recordRedisOp(operation, duration);
  }

  recordJob(queue, status) {
    recordJobResult(queue, status);
  }

  setActiveUsers(count) {
    updateActiveUsers(count);
  }
}

export default PrometheusService;
