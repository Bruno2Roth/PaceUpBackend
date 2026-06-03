import BaseRepository from './BaseRepository.js';

export class ActivityRepository extends BaseRepository {
  constructor() {
    super('activities');
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY start_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findByActivityType(activityType, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM activities
      WHERE activity_type = $1 AND deleted_at IS NULL
      ORDER BY start_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [activityType, limit, offset]);
    return result.rows;
  }

  async findByClubId(clubId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM activities
      WHERE club_id = $1 AND deleted_at IS NULL
      ORDER BY start_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [clubId, limit, offset]);
    return result.rows;
  }

  async findPublicActivitiesFromFollowing(userId, limit = 20, offset = 0) {
    const query = `
      SELECT a.* FROM activities a
      INNER JOIN followers f ON a.user_id = f.following_id
      WHERE f.follower_id = $1 AND a.is_private = false AND a.deleted_at IS NULL
      ORDER BY a.start_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM activities WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async getActivityStats(userId) {
    const query = `
      SELECT
        COUNT(*) as total_activities,
        SUM(distance_m) as total_distance,
        SUM(duration_seconds) as total_duration,
        SUM(elevation_gain_m) as total_elevation,
        AVG(average_heartrate) as avg_heartrate,
        MAX(max_speed_kmh) as max_speed
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
}

export default ActivityRepository;
