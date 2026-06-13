import logger from './logger.js';

let Bull = null;
try {
  Bull = await import('bullmq');
} catch (err) {
  logger.warn('BullMQ not available, queues disabled');
}

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: () => null,
};

const queues = {};
const workers = {};

export const queueNames = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  INTEGRATIONS: 'integrations',
  RANKINGS: 'rankings',
  ACHIEVEMENTS: 'achievements',
  METRICS: 'metrics',
  AI_REPORTS: 'ai-reports',
};

export const getQueue = (name) => {
  if (!Bull) return null;
  if (!queues[name]) {
    queues[name] = new Bull.Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    queues[name].on('error', () => {});
  }
  return queues[name];
};

export const createWorker = (name, processor, concurrency = 5) => {
  if (!Bull) return null;
  if (workers[name]) return workers[name];

  const worker = new Bull.Worker(name, async (job) => {
    const start = Date.now();
    logger.info(`Queue ${name}: processing job ${job.id}`, { data: job.data });
    try {
      const result = await processor(job);
      logger.info(`Queue ${name}: job ${job.id} completed`, { duration: Date.now() - start });
      return result;
    } catch (error) {
      logger.error(`Queue ${name}: job ${job.id} failed`, { error: error.message, attempt: job.attemptsMade });
      throw error;
    }
  }, {
    connection,
    concurrency,
    limiter: { max: 100, duration: 1000 },
  });

  worker.on('failed', (job, err) => {
    logger.error(`Queue ${name}: job ${job?.id} moved to dead letter`, { error: err.message });
  });
  worker.on('error', () => {});

  workers[name] = worker;
  return worker;
};

export const addJob = async (queueName, jobName, data, options = {}) => {
  const queue = getQueue(queueName);
  if (!queue) return null;
  return queue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    ...options,
  });
};

export const addDelayedJob = async (queueName, jobName, data, delayMs) => {
  return addJob(queueName, jobName, data, { delay: delayMs });
};

export const initializeQueues = () => {
  if (!Bull) {
    logger.warn('BullMQ not available, skipping queue initialization');
    return;
  }
  for (const name of Object.values(queueNames)) {
    getQueue(name);
    logger.info(`Queue initialized: ${name}`);
  }
};

export const closeAllQueues = async () => {
  for (const queue of Object.values(queues)) {
    try { await queue.close(); } catch {}
  }
  for (const worker of Object.values(workers)) {
    try { await worker.close(); } catch {}
  }
};

export default {
  getQueue,
  createWorker,
  addJob,
  addDelayedJob,
  initializeQueues,
  closeAllQueues,
  queueNames,
};
