import { ReportRepository, ModerationActionRepository } from '../../data/repositories/ModerationRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import logger from '../../configs/logger.js';

export class ModerationService {
  constructor() {
    this.reportRepo = new ReportRepository();
    this.moderationActionRepo = new ModerationActionRepository();
    this.userRepo = new UserRepository();
  }

  async createReport({ reporterId, reportedUserId, entityType, entityId, reason, description }) {
    return this.reportRepo.create({ reporterId, reportedUserId, entityType, entityId, reason, description });
  }

  async getPendingReports(limit = 50, offset = 0) {
    return this.reportRepo.findPending(limit, offset);
  }

  async resolveReport(reportId, moderatorId, status) {
    return this.reportRepo.review(reportId, moderatorId, status);
  }

  async banUser(moderatorId, targetUserId, reason) {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const action = await this.moderationActionRepo.create({
      moderatorId,
      targetUserId,
      actionType: 'ban',
      reason,
      details: { user_role: user.role },
    });
    await this.userRepo.update(targetUserId, { is_banned: true });
    logger.warn(`User ${targetUserId} banned by ${moderatorId}: ${reason}`);
    return action;
  }

  async suspendUser(moderatorId, targetUserId, reason, durationHours) {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const duration = durationHours * 3600000;
    const action = await this.moderationActionRepo.create({
      moderatorId,
      targetUserId,
      actionType: 'suspend',
      reason,
      details: { user_role: user.role, duration_hours: durationHours },
      duration,
    });
    const suspendedUntil = new Date(Date.now() + duration);
    await this.userRepo.update(targetUserId, {
      is_suspended: true,
      suspended_until: suspendedUntil,
      suspension_reason: reason,
    });
    logger.warn(`User ${targetUserId} suspended by ${moderatorId} for ${durationHours}h: ${reason}`);
    return action;
  }

  async unbanUser(moderatorId, targetUserId) {
    const action = await this.moderationActionRepo.create({
      moderatorId,
      targetUserId,
      actionType: 'unban',
      reason: 'Lifted by moderator',
    });
    await this.userRepo.update(targetUserId, { is_banned: false });
    logger.info(`User ${targetUserId} unbanned by ${moderatorId}`);
    return action;
  }

  async unsuspendUser(moderatorId, targetUserId) {
    const action = await this.moderationActionRepo.create({
      moderatorId,
      targetUserId,
      actionType: 'unsuspend',
      reason: 'Lifted by moderator',
    });
    await this.userRepo.update(targetUserId, { is_suspended: false, suspended_until: null, suspension_reason: null });
    logger.info(`User ${targetUserId} unsuspended by ${moderatorId}`);
    return action;
  }

  async isUserRestricted(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) return { restricted: true, reason: 'not_found' };
    if (user.is_banned) return { restricted: true, reason: 'banned' };
    if (user.is_suspended && user.suspended_until && new Date(user.suspended_until) > new Date()) {
      return { restricted: true, reason: 'suspended', until: user.suspended_until };
    }
    return { restricted: false };
  }
}

export default ModerationService;
