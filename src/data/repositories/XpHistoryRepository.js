import BaseRepository from './BaseRepository.js';

export class XpHistoryRepository extends BaseRepository {
  constructor() {
    super('xp_history');
  }

  async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT xh.*, xe.event_key, xe.description AS event_description
      FROM xp_history xh
      LEFT JOIN xp_events xe ON xh.xp_event_id = xe.id
      WHERE xh.user_id = $1
      ORDER BY xh.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getXpSummary(userId) {
    const query = `
      SELECT COALESCE(SUM(xp_amount), 0)::int AS total_xp_earned
      FROM xp_history
      WHERE user_id = $1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async countByUserId(userId) {
    return this.count('user_id = $1', [userId]);
  }
}

export default XpHistoryRepository;
