import BaseRepository from './BaseRepository.js';

export class UserBadgeRepository extends BaseRepository {
  constructor() {
    super('user_badges');
  }

  async findByUser(userId) {
    const query = `
      SELECT ub.*, sb.code, sb.title AS badge_title, sb.description AS badge_description,
        sb.icon_url AS badge_icon_url, sb.category, sb.criteria
      FROM user_badges ub
      INNER JOIN special_badges sb ON ub.badge_id = sb.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async hasBadge(userId, badgeCode) {
    const query = `
      SELECT 1 FROM user_badges ub
      INNER JOIN special_badges sb ON ub.badge_id = sb.id
      WHERE ub.user_id = $1 AND sb.code = $2
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId, badgeCode]);
    return result.rows.length > 0;
  }

  async awardBadge(userId, badgeCode) {
    const badge = await this.pool.query(
      'SELECT id FROM special_badges WHERE code = $1',
      [badgeCode],
    );
    if (!badge.rows[0]) {
      const err = new Error(`Badge '${badgeCode}' not found`);
      err.status = 404;
      throw err;
    }
    const badgeId = badge.rows[0].id;
    const existing = await this.pool.query(
      'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2 LIMIT 1',
      [userId, badgeId],
    );
    if (existing.rows.length > 0) return null;
    return this.create({ user_id: userId, badge_id: badgeId });
  }
}

export default UserBadgeRepository;
