import BaseRepository from './BaseRepository.js';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findUnread(userId) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async markAsRead(notificationId) {
    const query = `
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [notificationId]);
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async countUnread(userId) {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false';
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }
}

export default NotificationRepository;
