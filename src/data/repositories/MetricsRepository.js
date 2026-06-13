import BaseRepository from './BaseRepository.js';

export class MetricsRepository extends BaseRepository {
  constructor() {
    super('metrics');
  }

  async findByUserId(userId, limit = 30) {
    const query = `
      SELECT * FROM metrics
      WHERE user_id = $1
      ORDER BY calculated_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async findLatestByUserId(userId) {
    const query = `
      SELECT * FROM metrics
      WHERE user_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async getHistoryByDateRange(userId, startDate, endDate) {
    const query = `
      SELECT * FROM metrics
      WHERE user_id = $1
        AND calculated_at >= $2
        AND calculated_at <= $3
      ORDER BY calculated_at ASC
    `;
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  async getActivitiesForLoad(userId, sinceDate) {
    const query = `
      SELECT distance_m, duration_seconds, elevation_gain_m,
        average_heartrate, max_heartrate, pace_per_km,
        start_time, activity_type
      FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND start_time >= $2
      ORDER BY start_time ASC
    `;
    const result = await this.pool.query(query, [userId, sinceDate]);
    return result.rows;
  }

  async getUserAge(userId) {
    const query = `
      SELECT date_of_birth FROM users WHERE id = $1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
}

export default MetricsRepository;
