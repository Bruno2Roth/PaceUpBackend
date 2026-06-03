import BaseRepository from './BaseRepository.js';

export class LikeRepository extends BaseRepository {
  constructor() {
    super('likes');
  }

  async isLiked(activityId, userId) {
    const query = 'SELECT * FROM likes WHERE activity_id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [activityId, userId]);
    return result.rows.length > 0;
  }

  async countByActivityId(activityId) {
    const query = 'SELECT COUNT(*) as count FROM likes WHERE activity_id = $1';
    const result = await this.pool.query(query, [activityId]);
    return parseInt(result.rows[0].count, 10);
  }

  async findByActivityId(activityId) {
    const query = `
      SELECT u.* FROM users u
      INNER JOIN likes l ON u.id = l.user_id
      WHERE l.activity_id = $1
      ORDER BY l.liked_at DESC
    `;
    const result = await this.pool.query(query, [activityId]);
    return result.rows;
  }
}

export default LikeRepository;
