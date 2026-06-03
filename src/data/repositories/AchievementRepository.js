import BaseRepository from './BaseRepository.js';

export class AchievementRepository extends BaseRepository {
  constructor() {
    super('achievements');
  }

  async findByUserId(userId) {
    const query = `
      SELECT * FROM achievements
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async hasAchievement(userId, achievementType) {
    const query = `
      SELECT * FROM achievements
      WHERE user_id = $1 AND achievement_type = $2
    `;
    const result = await this.pool.query(query, [userId, achievementType]);
    return result.rows.length > 0;
  }

  async countByUserId(userId) {
    const query = 'SELECT COUNT(*) as count FROM achievements WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }
}

export default AchievementRepository;
