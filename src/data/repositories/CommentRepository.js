import BaseRepository from './BaseRepository.js';

export class CommentRepository extends BaseRepository {
  constructor() {
    super('comments');
  }

  async findByActivityId(activityId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM comments
      WHERE activity_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [activityId, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async countByActivityId(activityId) {
    const query = 'SELECT COUNT(*) as count FROM comments WHERE activity_id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [activityId]);
    return parseInt(result.rows[0].count, 10);
  }
}

export default CommentRepository;
