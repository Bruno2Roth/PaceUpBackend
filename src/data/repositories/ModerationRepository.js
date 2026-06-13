import BaseRepository from './BaseRepository.js';

export class ReportRepository extends BaseRepository {
  constructor() {
    super('reports');
  }

  async create({ reporterId, reportedUserId, entityType, entityId, reason, description }) {
    const query = `
      INSERT INTO reports (reporter_id, reported_user_id, entity_type, entity_id, reason, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      reporterId, reportedUserId, entityType, entityId, reason, description || null,
    ]);
    return result.rows[0];
  }

  async findPending(limit = 50, offset = 0) {
    return this.pool.queryMany(
      `SELECT r.*, rep.name as reporter_name, ru.name as reported_name
       FROM reports r
       LEFT JOIN users rep ON r.reporter_id = rep.id
       LEFT JOIN users ru ON r.reported_user_id = ru.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async review(reportId, moderatorId, status) {
    const query = `
      UPDATE reports SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `;
    const result = await this.pool.query(query, [status, moderatorId, reportId]);
    return result.rows[0];
  }
}

export class ModerationActionRepository extends BaseRepository {
  constructor() {
    super('moderation_actions');
  }

  async create({ moderatorId, targetUserId, actionType, reason, details, duration }) {
    const expiresAt = duration ? new Date(Date.now() + duration) : null;
    const query = `
      INSERT INTO moderation_actions (moderator_id, target_user_id, action_type, reason, details, duration, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      moderatorId, targetUserId, actionType, reason,
      JSON.stringify(details || {}), duration || null, expiresAt,
    ]);
    return result.rows[0];
  }

  async findActiveByUser(userId) {
    return this.pool.queryMany(
      `SELECT * FROM moderation_actions
       WHERE target_user_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY created_at DESC`,
      [userId],
    );
  }
}

export default { ReportRepository, ModerationActionRepository };
