import UserRepository from '../../data/repositories/UserRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import AuditLogRepository from '../../data/repositories/AuditLogRepository.js';
import AdminActionRepository from '../../data/repositories/AdminActionRepository.js';
import BackupLogRepository from '../../data/repositories/BackupLogRepository.js';
import logger from '../../configs/logger.js';

export class AdminService {
  constructor() {
    this.userRepo = new UserRepository();
    this.activityRepo = new ActivityRepository();
    this.auditRepo = new AuditLogRepository();
    this.adminActionRepo = new AdminActionRepository();
    this.backupLogRepo = new BackupLogRepository();
  }

  async logAction(adminId, action, targetType, targetId, details) {
    return this.adminActionRepo.create({ adminId, action, targetType, targetId, details });
  }

  async listUsers(limit = 20, offset = 0, filters = {}) {
    let query = 'SELECT id, name, username, email, role, is_active, is_banned, is_suspended, email_verified_at, created_at, last_login FROM users WHERE deleted_at IS NULL';
    const params = [];
    const conditions = [];

    if (filters.role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(filters.role);
    }
    if (filters.search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${filters.search}%`);
    }
    if (filters.is_banned !== undefined) {
      conditions.push(`is_banned = $${params.length + 1}`);
      params.push(filters.is_banned);
    }
    if (filters.is_suspended !== undefined) {
      conditions.push(`is_suspended = $${params.length + 1}`);
      params.push(filters.is_suspended);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return this.userRepo.pool.queryMany(query, params);
  }

  async getUserDetail(id) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const activityCount = await this.activityRepo.count('user_id = $1 AND deleted_at IS NULL', [id]);
    const auditLogs = await this.auditRepo.findByUser(id, 20, 0);

    return { ...user, activity_count: parseInt(activityCount?.count || activityCount || 0, 10), recent_audit_logs: auditLogs };
  }

  async updateUser(adminId, userId, updates) {
    const allowedFields = ['name', 'username', 'role', 'is_active', 'bio', 'city', 'country'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    if (Object.keys(filtered).length === 0) {
      const err = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    const oldUser = await this.userRepo.findById(userId);
    await this.userRepo.update(userId, filtered);

    await this.logAction(adminId, 'user_update', 'user', userId, {
      before: oldUser, after: filtered,
    });

    return this.userRepo.findById(userId);
  }

  async deleteUser(adminId, userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    await this.userRepo.softDelete(userId);
    logger.warn(`User ${userId} soft-deleted by admin ${adminId}`);

    await this.logAction(adminId, 'user_delete', 'user', userId, { user_role: user.role });
    return { deleted: true };
  }

  async listActivities(limit = 20, offset = 0) {
    const query = `
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC LIMIT $1 OFFSET $2
    `;
    return this.activityRepo.pool.queryMany(query, [limit, offset]);
  }

  async deleteActivity(adminId, activityId) {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    await this.activityRepo.softDelete(activityId);
    await this.logAction(adminId, 'activity_delete', 'activity', activityId, { user_id: activity.user_id });
    return { deleted: true };
  }

  async getReports(limit = 50, offset = 0) {
    return this.auditRepo.findAll(limit, offset, 'created_at DESC');
  }

  async getBackups(limit = 20) {
    return this.backupLogRepo.findRecent(limit);
  }
}

export default AdminService;
