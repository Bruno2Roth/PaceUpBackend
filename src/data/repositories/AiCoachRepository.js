import BaseRepository from './BaseRepository.js';

export class AiCoachRepository extends BaseRepository {
  constructor() {
    super('ai_analysis');
  }

  async findByUserId(userId, analysisType = null, limit = 20) {
    let query;
    const params = [userId];

    if (analysisType) {
      params.push(analysisType);
      query = `
        SELECT * FROM ai_analysis
        WHERE user_id = $1 AND analysis_type = $2
        ORDER BY created_at DESC
        LIMIT $${params.length + 1}
      `;
    } else {
      query = `
        SELECT * FROM ai_analysis
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
    }
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async findLatestByType(userId, analysisType) {
    const query = `
      SELECT * FROM ai_analysis
      WHERE user_id = $1 AND analysis_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId, analysisType]);
    return result.rows[0];
  }

  async getWeeklyActivities(userId, startDate, endDate) {
    const query = `
      SELECT distance_m, duration_seconds, elevation_gain_m,
        average_heartrate, pace_per_km, start_time, activity_type,
        calories_burned
      FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND start_time >= $2
        AND start_time < $3
      ORDER BY start_time ASC
    `;
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  async getHistorySummary(userId, sinceDate) {
    const query = `
      SELECT
        COUNT(*)::int as total_activities,
        COALESCE(SUM(distance_m), 0) as total_distance,
        COALESCE(SUM(duration_seconds), 0) as total_duration,
        COALESCE(SUM(elevation_gain_m), 0) as total_elevation,
        COUNT(DISTINCT DATE(start_time))::int as active_days
      FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND start_time >= $2
    `;
    const result = await this.pool.query(query, [userId, sinceDate]);
    return result.rows[0];
  }

  async getWeeklyDistanceComparison(userId, currentWeekStart, previousWeekStart) {
    const query = `
      SELECT
        COALESCE(SUM(distance_m) FILTER (WHERE start_time >= $2 AND start_time < $3), 0) as current_week,
        COALESCE(SUM(distance_m) FILTER (WHERE start_time >= $4 AND start_time < $2), 0) as previous_week
      FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND start_time >= $4
        AND start_time < $3
    `;
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const result = await this.pool.query(query, [userId, currentWeekStart, weekEnd, previousWeekStart]);
    return result.rows[0];
  }

  async getPersonalBests(userId) {
    const distances = [1000, 5000, 10000, 21097, 42195];
    const results = {};
    for (const d of distances) {
      const query = `
        SELECT MIN(duration_seconds) as best_time, start_time
        FROM activities
        WHERE user_id = $1 AND deleted_at IS NULL
          AND distance_m >= $2 AND activity_type IN ('running', 'trail_running')
          AND duration_seconds IS NOT NULL
        GROUP BY start_time
        ORDER BY best_time ASC
        LIMIT 1
      `;
      const result = await this.pool.query(query, [userId, d]);
      if (result.rows.length > 0) {
        const label = d < 1000 ? `${d}M` : d >= 42195 ? '42K' : `${d / 1000}K`;
        results[label] = {
          time_seconds: result.rows[0].best_time,
          achieved_at: result.rows[0].start_time,
        };
      }
    }
    return results;
  }

  async getStreakData(userId) {
    const query = `
      SELECT DISTINCT DATE(start_time) as activity_date
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY activity_date DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map((r) => r.activity_date);
  }
}

export default AiCoachRepository;
