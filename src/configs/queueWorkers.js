import { createWorker, queueNames } from './queue.js';
import logger from './logger.js';

export const registerWorkers = () => {
  createWorker(queueNames.NOTIFICATIONS, async (job) => {
    const { type, userId, notification } = job.data;
    const { emitNotification, emitNotificationCount } = await import('../sockets/emitter.js');
    const NotificationService = (await import('../application/services/NotificationService.js')).default;
    const service = new NotificationService();

    if (type === 'send') {
      const created = await service.createNotification(notification);
      emitNotification(userId, created);
      const count = await service.getUnreadCount(userId);
      emitNotificationCount(userId, count);
    }
    return { delivered: true };
  });

  createWorker(queueNames.EMAILS, async (job) => {
    const { type, to, subject, text, html, token } = job.data;
    const email = await import('./email.js');

    if (type === 'verify') {
      await email.sendVerificationEmail(to, token);
    } else if (type === 'reset_password') {
      await email.sendPasswordResetEmail(to, token);
    } else {
      await email.sendEmail({ to, subject, text, html });
    }
    return { sent: true };
  });

  createWorker(queueNames.INTEGRATIONS, async (job) => {
    const { provider, userId, mode } = job.data;
    const IntegrationSyncService = (await import('../application/services/IntegrationSyncService.js')).default;
    const service = new IntegrationSyncService();
    await service.sync(provider, userId, mode || 'automatic');
    return { synced: true };
  });

  createWorker(queueNames.RANKINGS, async (job) => {
    const { type, userId } = job.data;
    const RankingService = (await import('../application/services/RankingService.js')).default;
    const service = new RankingService();
    if (type === 'all') {
      await service.recalculateAll();
    } else {
      await service.recalculateUserRankings(userId);
    }
    return { completed: true };
  });

  createWorker(queueNames.ACHIEVEMENTS, async (job) => {
    const { userId, activityId } = job.data;
    const AchievementService = (await import('../application/services/AchievementService.js')).default;
    const service = new AchievementService();
    await service.evaluateAchievements(userId);
    return { completed: true };
  });

  createWorker(queueNames.METRICS, async (job) => {
    const { userId, activityId } = job.data;
    const MetricsService = (await import('../application/services/MetricsService.js')).default;
    const service = new MetricsService();
    if (activityId) {
      await service.calculateMetrics(userId, activityId);
    } else {
      await service.calculateMetrics(userId);
    }
    return { completed: true };
  });

  createWorker(queueNames.AI_REPORTS, async (job) => {
    const { userId } = job.data;
    const AiCoachService = (await import('../application/services/AiCoachService.js')).default;
    const service = new AiCoachService();
    await service.getWeeklyReport(userId);
    return { completed: true };
  });

  logger.info('All queue workers registered');
};
