import BaseRepository from './BaseRepository.js';

export class AuditLogRepository extends BaseRepository {
  constructor() {
    super('audit_logs');
  }

  async create({ userId, action, entity, entityId, metadata, ip, userAgent }) {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      userId,
      action,
      entity,
      entityId || null,
      JSON.stringify(metadata || {}),
      ip || null,
      userAgent || null,
    ]);
    return result.rows[0];
  }

  async findByUser(userId, limit = 50, offset = 0) {
    return this.pool.queryMany(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );
  }

  async findByAction(action, limit = 50, offset = 0) {
    return this.pool.queryMany(
      'SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [action, limit, offset],
    );
  }

  async findRecent(hoursBack = 24, limit = 100) {
    return this.pool.queryMany(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
       ORDER BY al.created_at DESC LIMIT $1`,
      [limit],
    );
  }
}

export default AuditLogRepository;
