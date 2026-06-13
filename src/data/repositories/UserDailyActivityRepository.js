import BaseRepository from './BaseRepository.js';

export class UserDailyActivityRepository extends BaseRepository {
  constructor() {
    super('user_daily_activity');
  }

  async upsert(userId, date, data) {
    const result = await this.pool.query(`
      INSERT INTO user_daily_activity (user_id, date, is_active, session_count, activity_count, distance_km)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        is_active = EXCLUDED.is_active,
        session_count = user_daily_activity.session_count + EXCLUDED.session_count,
        activity_count = user_daily_activity.activity_count + EXCLUDED.activity_count,
        distance_km = user_daily_activity.distance_km + EXCLUDED.distance_km
      RETURNING *
    `, [userId, date, data.isActive, data.sessionCount, data.activityCount, data.distanceKm]);
    return result.rows[0];
  }

  async getByUserAndRange(userId, startDate, endDate) {
    const result = await this.pool.query(`
      SELECT * FROM user_daily_activity
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC
    `, [userId, startDate, endDate]);
    return result.rows;
  }
}

export default UserDailyActivityRepository;
