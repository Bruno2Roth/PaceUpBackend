import BaseRepository from './BaseRepository.js';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT n.*,
        COALESCE(actor.name, '') AS actor_name,
        COALESCE(actor.profile_picture_url, '') AS actor_avatar
      FROM notifications n
      LEFT JOIN users actor ON n.actor_id = actor.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findUnread(userId) {
    const query = `
      SELECT n.*,
        COALESCE(actor.name, '') AS actor_name,
        COALESCE(actor.profile_picture_url, '') AS actor_avatar
      FROM notifications n
      LEFT JOIN users actor ON n.actor_id = actor.id
      WHERE n.user_id = $1 AND n.is_read = false
      ORDER BY n.created_at DESC
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

  async createNotification({ userId, type, title, message, actorId, metadata, activityId, commentId, challengeId, clubId }) {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, actor_id, metadata, activity_id, comment_id, challenge_id, club_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      userId, type, title, message, actorId, metadata || {},
      activityId || null, commentId || null,
      challengeId || null, clubId || null,
    ]);
    return result.rows[0];
  }

  async hasSimilarNotification(userId, type, actorId, hoursBack = 24) {
    const query = `
      SELECT id FROM notifications
      WHERE user_id = $1 AND type = $2 AND actor_id = $3
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId, type, actorId]);
    return result.rows.length > 0;
  }
}

export default NotificationRepository;
