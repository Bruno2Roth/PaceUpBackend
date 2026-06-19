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

  async findPublicActivitiesFromFollowing(userId, cursor = null, limit = 20) {
    const query = cursor
      ? `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar
        FROM activities a
        INNER JOIN followers f ON a.user_id = f.following_id
        INNER JOIN users u ON a.user_id = u.id
        WHERE f.follower_id = $1
          AND a.is_private = false
          AND a.deleted_at IS NULL
          AND a.start_time < $2
        ORDER BY a.start_time DESC
        LIMIT $3
      `
      : `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar
        FROM activities a
        INNER JOIN followers f ON a.user_id = f.following_id
        INNER JOIN users u ON a.user_id = u.id
        WHERE f.follower_id = $1
          AND a.is_private = false
          AND a.deleted_at IS NULL
        ORDER BY a.start_time DESC
        LIMIT $2
      `;
    const params = cursor ? [userId, cursor, limit] : [userId, limit];
    const result = await this.pool.query(query, params);
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
        COALESCE(SUM(distance_m), 0) as total_distance,
        COALESCE(SUM(duration_seconds), 0) as total_duration,
        COALESCE(SUM(elevation_gain_m), 0) as total_elevation,
        AVG(average_heartrate) as avg_heartrate,
        MAX(max_speed_kmh) as max_speed
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async getActivityStatsByPeriod(userId, sinceDate) {
    const query = `
      SELECT
        COUNT(*)::int as total_activities,
        COALESCE(SUM(distance_m), 0) as total_distance,
        COALESCE(SUM(duration_seconds), 0) as total_duration,
        COALESCE(SUM(elevation_gain_m), 0) as total_elevation,
        COUNT(*) FILTER (WHERE activity_type = 'running')::int as run_count,
        COUNT(*) FILTER (WHERE activity_type = 'trail_running')::int as trail_count,
        COUNT(*) FILTER (WHERE activity_type = 'treadmill')::int as treadmill_count
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL AND start_time >= $2
    `;
    const result = await this.pool.query(query, [userId, sinceDate]);
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

  async getRecentActivities(userId, limit = 5) {
    const query = `
      SELECT id, title, activity_type, distance_m, duration_seconds,
        start_time, pace_per_km, elevation_gain_m
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY start_time DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async getTopDistances(userId, limit = 5) {
    const query = `
      SELECT id, title, distance_m, duration_seconds, start_time, activity_type
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY distance_m DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
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

  async getGlobalFeedWithCounts(cursor = null, limit = 20) {
    const query = cursor
      ? `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar,
          COALESCE(l.like_count, 0)::int AS likes_count,
          COALESCE(c.comment_count, 0)::int AS comments_count
        FROM activities a
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS like_count FROM likes GROUP BY activity_id) l ON l.activity_id = a.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS comment_count FROM comments WHERE deleted_at IS NULL AND parent_id IS NULL GROUP BY activity_id) c ON c.activity_id = a.id
        WHERE a.is_private = false
          AND a.deleted_at IS NULL
          AND a.start_time < $1
        ORDER BY a.start_time DESC
        LIMIT $2
      `
      : `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar,
          COALESCE(l.like_count, 0)::int AS likes_count,
          COALESCE(c.comment_count, 0)::int AS comments_count
        FROM activities a
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS like_count FROM likes GROUP BY activity_id) l ON l.activity_id = a.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS comment_count FROM comments WHERE deleted_at IS NULL AND parent_id IS NULL GROUP BY activity_id) c ON c.activity_id = a.id
        WHERE a.is_private = false
          AND a.deleted_at IS NULL
        ORDER BY a.start_time DESC
        LIMIT $1
      `;
    const params = cursor ? [cursor, limit] : [limit];
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getFeedWithCounts(userId, cursor = null, limit = 20) {
    const query = cursor
      ? `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar,
          COALESCE(l.like_count, 0)::int AS likes_count,
          COALESCE(c.comment_count, 0)::int AS comments_count
        FROM activities a
        INNER JOIN followers f ON a.user_id = f.following_id
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS like_count FROM likes GROUP BY activity_id) l ON l.activity_id = a.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS comment_count FROM comments WHERE deleted_at IS NULL AND parent_id IS NULL GROUP BY activity_id) c ON c.activity_id = a.id
        WHERE f.follower_id = $1
          AND a.is_private = false
          AND a.deleted_at IS NULL
          AND a.start_time < $2
        ORDER BY a.start_time DESC
        LIMIT $3
      `
      : `
        SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar,
          COALESCE(l.like_count, 0)::int AS likes_count,
          COALESCE(c.comment_count, 0)::int AS comments_count
        FROM activities a
        INNER JOIN followers f ON a.user_id = f.following_id
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS like_count FROM likes GROUP BY activity_id) l ON l.activity_id = a.id
        LEFT JOIN (SELECT activity_id, COUNT(*)::int AS comment_count FROM comments WHERE deleted_at IS NULL AND parent_id IS NULL GROUP BY activity_id) c ON c.activity_id = a.id
        WHERE f.follower_id = $1
          AND a.is_private = false
          AND a.deleted_at IS NULL
        ORDER BY a.start_time DESC
        LIMIT $2
      `;
    const params = cursor ? [userId, cursor, limit] : [userId, limit];
    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

export default ActivityRepository;
