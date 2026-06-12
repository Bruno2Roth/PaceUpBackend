import BaseRepository from './BaseRepository.js';

export class CommentRepository extends BaseRepository {
  constructor() {
    super('comments');
  }

  async findByActivityId(activityId, limit = 20, offset = 0) {
    const query = `
      SELECT c.*, u.name AS author_name, u.profile_picture_url AS author_avatar
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.activity_id = $1 AND c.deleted_at IS NULL AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [activityId, limit, offset]);
    return result.rows;
  }

  async findReplies(commentId, limit = 20, offset = 0) {
    const query = `
      SELECT c.*, u.name AS author_name, u.profile_picture_url AS author_avatar
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [commentId, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async countByActivityId(activityId) {
    const query = 'SELECT COUNT(*) as count FROM comments WHERE activity_id = $1 AND deleted_at IS NULL AND parent_id IS NULL';
    const result = await this.pool.query(query, [activityId]);
    return parseInt(result.rows[0].count, 10);
  }

  async countReplies(commentId) {
    const query = 'SELECT COUNT(*) as count FROM comments WHERE parent_id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [commentId]);
    return parseInt(result.rows[0].count, 10);
  }

  async updateComment(commentId, body) {
    const query = `
      UPDATE comments SET body = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [body, commentId]);
    return result.rows[0];
  }

  async incrementReplyCount(commentId) {
    const query = `
      UPDATE comments SET reply_count = reply_count + 1 WHERE id = $1
    `;
    await this.pool.query(query, [commentId]);
  }
}

export default CommentRepository;
