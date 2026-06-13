import BaseRepository from './BaseRepository.js';

export class AdminActionRepository extends BaseRepository {
  constructor() {
    super('admin_actions');
  }

  async create({ adminId, action, targetType, targetId, details }) {
    const query = `
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      adminId, action, targetType || null, targetId || null,
      JSON.stringify(details || {}),
    ]);
    return result.rows[0];
  }

  async findRecent(limit = 50) {
    return this.pool.queryMany(
      `SELECT aa.*, u.name as admin_name
       FROM admin_actions aa
       LEFT JOIN users u ON aa.admin_id = u.id
       ORDER BY aa.created_at DESC LIMIT $1`,
      [limit],
    );
  }
}

export default AdminActionRepository;
