import BaseRepository from './BaseRepository.js';

export class SharedActivityRepository extends BaseRepository {
  constructor() {
    super('shared_activities');
  }

  async findByToken(token) {
    const query = `
      SELECT sa.*, a.*, u.name AS user_name, u.username, u.profile_picture_url AS user_avatar
      FROM shared_activities sa
      INNER JOIN activities a ON sa.activity_id = a.id
      INNER JOIN users u ON sa.user_id = u.id
      WHERE sa.share_token = $1
    `;
    const result = await this.pool.query(query, [token]);
    return result.rows[0];
  }

  async findByActivity(activityId) {
    return this.findMany('activity_id = $1', [activityId]);
  }

  async findByUser(userId) {
    const query = `
      SELECT sa.*, a.title AS activity_title, a.activity_type, a.distance_m,
        a.duration_seconds, a.start_time
      FROM shared_activities sa
      INNER JOIN activities a ON sa.activity_id = a.id
      WHERE sa.user_id = $1
      ORDER BY sa.created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async incrementViewCount(id) {
    const query = `
      UPDATE shared_activities
      SET view_count = view_count + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

export default SharedActivityRepository;
