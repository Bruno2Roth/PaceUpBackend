import AuditLogRepository from '../../data/repositories/AuditLogRepository.js';

export class AuditService {
  constructor() {
    this.auditRepo = new AuditLogRepository();
  }

  async log({ userId, action, entity, entityId, metadata, ip, userAgent }) {
    return this.auditRepo.create({ userId, action, entity, entityId, metadata, ip, userAgent });
  }

  async logLogin(userId, ip, userAgent) {
    return this.log({ userId, action: 'login', entity: 'user', entityId: userId, ip, userAgent });
  }

  async logLogout(userId, ip, userAgent) {
    return this.log({ userId, action: 'logout', entity: 'user', entityId: userId, ip, userAgent });
  }

  async logPasswordChange(userId, ip, userAgent) {
    return this.log({ userId, action: 'password_change', entity: 'user', entityId: userId, ip, userAgent });
  }

  async logEmailChange(userId, ip, userAgent) {
    return this.log({ userId, action: 'email_change', entity: 'user', entityId: userId, ip, userAgent });
  }

  async logActivityDelete(userId, activityId, ip, userAgent) {
    return this.log({ userId, action: 'activity_delete', entity: 'activity', entityId: activityId, ip, userAgent });
  }

  async logRoleChange(adminId, targetUserId, oldRole, newRole, ip, userAgent) {
    return this.log({
      userId: adminId,
      action: 'role_change',
      entity: 'user',
      entityId: targetUserId,
      metadata: { old_role: oldRole, new_role: newRole },
      ip,
      userAgent,
    });
  }

  async logSubscriptionChange(userId, planId, action, ip, userAgent) {
    return this.log({
      userId,
      action: `subscription_${action}`,
      entity: 'subscription',
      entityId: planId,
      ip,
      userAgent,
    });
  }

  async findRecent(hoursBack = 24, limit = 100) {
    return this.auditRepo.findRecent(hoursBack, limit);
  }

  async findById(id) {
    return this.auditRepo.findById(id);
  }

  async findAll(limit = 50, offset = 0) {
    return this.auditRepo.findAll(limit, offset, 'created_at DESC');
  }
}

export default AuditService;
