import { dbPool } from '../../configs/database.js';
import redis from '../../configs/redis.js';

const RANKING_CACHE_PREFIX = 'ranking:';
const RANKING_CACHE_TTL = 600;

export class RankingRepository {
  constructor() {
    this.pool = dbPool.getPool();
  }

  async getGlobalRankings(criteria = 'distance', activityType = null, limit = 100, offset = 0) {
    const orderMap = {
      distance: 'SUM(a.distance_m) DESC',
      count: 'COUNT(*) DESC',
      duration: 'SUM(a.duration_seconds) DESC',
      elevation: 'SUM(a.elevation_gain_m) DESC',
    };
    const orderBy = orderMap[criteria] || orderMap.distance;

    let typeFilter = '';
    const params = [limit, offset];
    if (activityType) {
      typeFilter = 'AND a.activity_type = $3';
      params.push(activityType);
    }

    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        COUNT(*)::int AS activity_count,
        COALESCE(SUM(a.distance_m), 0) AS total_distance,
        COALESCE(SUM(a.duration_seconds), 0) AS total_duration,
        COALESCE(SUM(a.elevation_gain_m), 0) AS total_elevation,
        ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS rank
      FROM users u
      INNER JOIN activities a ON u.id = a.user_id
      WHERE a.deleted_at IS NULL AND u.deleted_at IS NULL
        ${typeFilter}
      GROUP BY u.id
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `, params);
    return result.rows;
  }

  async getUserRank(userId, criteria = 'distance') {
    const cacheKey = `${RANKING_CACHE_PREFIX}user:${userId}:${criteria}`;
    const cached = await redis.get(cacheKey);
    if (cached !== null) return cached;

    const selectMap = {
      distance: 'SUM(a.distance_m)',
      count: 'COUNT(*)',
      duration: 'SUM(a.duration_seconds)',
      elevation: 'SUM(a.elevation_gain_m)',
    };
    const selectExpr = selectMap[criteria] || selectMap.distance;

    const result = await this.pool.query(`
      WITH user_stats AS (
        SELECT u.id, ${selectExpr} AS value
        FROM users u
        INNER JOIN activities a ON u.id = a.user_id
        WHERE a.deleted_at IS NULL AND u.deleted_at IS NULL
        GROUP BY u.id
      )
      SELECT COUNT(*)::int + 1 AS rank
      FROM user_stats
      WHERE value > (SELECT value FROM user_stats WHERE id = $1)
    `, [userId]);

    const rank = result.rows[0]?.rank || 0;
    await redis.set(cacheKey, rank, RANKING_CACHE_TTL);
    return rank;
  }

  async getClubRankings(clubId, criteria = 'distance', limit = 100) {
    const orderMap = {
      distance: 'SUM(a.distance_m) DESC',
      count: 'COUNT(*) DESC',
      duration: 'SUM(a.duration_seconds) DESC',
    };
    const orderBy = orderMap[criteria] || orderMap.distance;

    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        COUNT(*)::int AS activity_count,
        COALESCE(SUM(a.distance_m), 0) AS total_distance,
        COALESCE(SUM(a.duration_seconds), 0) AS total_duration,
        ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS rank
      FROM club_members cm
      INNER JOIN users u ON cm.user_id = u.id
      INNER JOIN activities a ON u.id = a.user_id
      WHERE cm.club_id = $1 AND a.deleted_at IS NULL
        AND (a.is_private = false OR a.user_id = ANY(SELECT user_id FROM club_members WHERE club_id = $1))
      GROUP BY u.id
      ORDER BY ${orderBy}
      LIMIT $2
    `, [clubId, limit]);
    return result.rows;
  }

  async getMonthlyRankings(year, month, criteria = 'distance', limit = 100) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const orderMap = {
      distance: 'SUM(a.distance_m) DESC',
      count: 'COUNT(*) DESC',
      duration: 'SUM(a.duration_seconds) DESC',
    };
    const orderBy = orderMap[criteria] || orderMap.distance;

    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        COUNT(*)::int AS activity_count,
        COALESCE(SUM(a.distance_m), 0) AS total_distance,
        COALESCE(SUM(a.duration_seconds), 0) AS total_duration,
        ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS rank
      FROM users u
      INNER JOIN activities a ON u.id = a.user_id
      WHERE a.deleted_at IS NULL
        AND a.start_time >= $1::timestamp
        AND a.start_time < ($1::timestamp + INTERVAL '1 month')
      GROUP BY u.id
      ORDER BY ${orderBy}
      LIMIT $2
    `, [startDate, limit]);
    return result.rows;
  }

  async getYearlyRankings(year, criteria = 'distance', limit = 100) {
    const startDate = `${year}-01-01`;
    const orderMap = {
      distance: 'SUM(a.distance_m) DESC',
      count: 'COUNT(*) DESC',
      duration: 'SUM(a.duration_seconds) DESC',
    };
    const orderBy = orderMap[criteria] || orderMap.distance;

    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        COUNT(*)::int AS activity_count,
        COALESCE(SUM(a.distance_m), 0) AS total_distance,
        COALESCE(SUM(a.duration_seconds), 0) AS total_duration,
        ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS rank
      FROM users u
      INNER JOIN activities a ON u.id = a.user_id
      WHERE a.deleted_at IS NULL
        AND a.start_time >= $1::timestamp
        AND a.start_time < ($1::timestamp + INTERVAL '1 year')
      GROUP BY u.id
      ORDER BY ${orderBy}
      LIMIT $2
    `, [startDate, limit]);
    return result.rows;
  }

  async clearCache() {
    await redis.delete(`${RANKING_CACHE_PREFIX}*`);
  }
}

export default RankingRepository;
