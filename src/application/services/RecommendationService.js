import { dbPool } from '../../configs/database.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import FollowerRepository from '../../data/repositories/FollowerRepository.js';

export class RecommendationService {
  constructor() {
    this.pool = dbPool.getPool();
    this.activityRepository = new ActivityRepository();
    this.followerRepository = new FollowerRepository();
  }

  async recommendClubs(userId, limit = 10) {
    const userActivities = await this.activityRepository.pool.query(`
      SELECT DISTINCT a.club_id FROM activities a
      WHERE a.user_id = $1 AND a.club_id IS NOT NULL AND a.deleted_at IS NULL
    `, [userId]);
    const frequentClubIds = userActivities.rows.map(r => r.club_id);

    const followers = await this.followerRepository.getFollowing(userId);
    const followerIds = followers.map(f => f.id);

    const conditions = ['c.is_private = FALSE', 'c.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (followerIds.length > 0) {
      conditions.push(`c.founder_id = ANY($${paramIndex}::uuid[])`);
      params.push(followerIds);
      paramIndex++;
    }

    if (frequentClubIds.length > 0) {
      conditions.push(`c.id != ALL($${paramIndex}::uuid[])`);
      params.push(frequentClubIds);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await this.pool.query(`
      SELECT c.*, u.name AS founder_name, c.member_count AS relevance_score
      FROM clubs c
      LEFT JOIN users u ON c.founder_id = u.id
      WHERE ${whereClause}
      ORDER BY relevance_score DESC
      LIMIT $${paramIndex}
    `, [...params, limit]);

    return result.rows;
  }

  async recommendChallenges(userId, limit = 10) {
    const userLevel = await this.pool.query(`
      SELECT AVG(a.distance_m) AS avg_distance, AVG(a.pace_per_km) AS avg_pace
      FROM activities a
      WHERE a.user_id = $1 AND a.deleted_at IS NULL AND a.distance_m IS NOT NULL
    `, [userId]);
    const avgDistance = parseFloat(userLevel.rows[0]?.avg_distance) || 0;
    const avgPace = parseFloat(userLevel.rows[0]?.avg_pace) || 0;

    const joinedResult = await this.pool.query(`
      SELECT challenge_id FROM challenge_participants WHERE user_id = $1
    `, [userId]);
    const joinedIds = joinedResult.rows.map(r => r.challenge_id);

    const conditions = ['ch.is_active = TRUE', 'ch.end_date > CURRENT_TIMESTAMP', 'ch.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (joinedIds.length > 0) {
      conditions.push(`ch.id != ALL($${paramIndex}::uuid[])`);
      params.push(joinedIds);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let scoreExpr;
    if (avgDistance > 0) {
      params.push(avgDistance / 1000);
      scoreExpr = `
        CASE WHEN ch.goal_unit = 'km' THEN
          1.0 - ABS(ch.goal_value - $${paramIndex}) / GREATEST(ch.goal_value, $${paramIndex})
        ELSE 0.5 END + ch.participant_count * 0.01
      `;
      paramIndex++;
    } else {
      scoreExpr = 'ch.participant_count * 0.01';
    }

    const result = await this.pool.query(`
      SELECT ch.*, (${scoreExpr}) AS relevance_score
      FROM challenges ch
      WHERE ${whereClause}
      ORDER BY relevance_score DESC
      LIMIT $${paramIndex}
    `, [...params, limit]);

    return result.rows;
  }

  async recommendRoutes(userId, limit = 10) {
    const frequentLocations = await this.pool.query(`
      SELECT a.lat, a.lng, COUNT(*) AS freq
      FROM activities a
      WHERE a.user_id = $1 AND a.deleted_at IS NULL AND a.lat IS NOT NULL AND a.lng IS NOT NULL
      GROUP BY a.lat, a.lng
      ORDER BY freq DESC
      LIMIT 3
    `, [userId]);

    const userPrefDistance = await this.pool.query(`
      SELECT AVG(a.distance_m) AS avg_distance
      FROM activities a
      WHERE a.user_id = $1 AND a.deleted_at IS NULL AND a.distance_m IS NOT NULL
    `, [userId]);
    const avgDistance = parseFloat(userPrefDistance.rows[0]?.avg_distance) || 0;

    const conditions = ['r.is_public = TRUE', 'r.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    const whereClause = conditions.join(' AND ');

    if (frequentLocations.rows.length > 0) {
      const loc = frequentLocations.rows[0];
      params.push(parseFloat(loc.lat), parseFloat(loc.lng));
      let baseQuery = `
        SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar,
          (6371 * acos(cos(radians($${paramIndex})) * cos(radians(r.lat)) * cos(radians(r.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(r.lat)))) AS distance_km,
          r.activity_count AS relevance_score
        FROM routes r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${whereClause} AND r.lat IS NOT NULL AND r.lng IS NOT NULL
      `;
      paramIndex += 2;

      if (avgDistance > 0) {
        params.push(avgDistance);
        baseQuery += ` ORDER BY ABS(r.distance_m - $${paramIndex}) ASC, relevance_score DESC`;
        paramIndex++;
      } else {
        baseQuery += ' ORDER BY distance_km ASC, relevance_score DESC';
      }

      baseQuery += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;

      const result = await this.pool.query(baseQuery, params);
      return result.rows;
    }

    let queryStr = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar,
        r.activity_count AS relevance_score
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
    `;

    if (avgDistance > 0) {
      params.push(avgDistance);
      queryStr += ` ORDER BY ABS(r.distance_m - $${paramIndex}) ASC, relevance_score DESC`;
      paramIndex++;
    } else {
      queryStr += ' ORDER BY relevance_score DESC';
    }

    queryStr += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.pool.query(queryStr, params);
    return result.rows;
  }

  async recommendEvents(userId, limit = 10) {
    const user = await this.pool.query(`
      SELECT lat, lng FROM users WHERE id = $1
    `, [userId]);

    const userClubs = await this.pool.query(`
      SELECT club_id FROM club_members WHERE user_id = $1
    `, [userId]);
    const clubIds = userClubs.rows.map(r => r.club_id);

    const userPrefs = await this.pool.query(`
      SELECT AVG(a.distance_m) AS avg_distance, AVG(a.pace_per_km) AS avg_pace
      FROM activities a
      WHERE a.user_id = $1 AND a.deleted_at IS NULL
    `, [userId]);
    const avgDistance = parseFloat(userPrefs.rows[0]?.avg_distance) || 0;

    const conditions = ['e.is_canceled = FALSE', 'e.start_date > CURRENT_TIMESTAMP'];
    const params = [];
    let paramIndex = 1;

    const whereClause = conditions.join(' AND ');

    let queryStr;
    if (user.rows[0]?.lat && user.rows[0]?.lng) {
      const lat = parseFloat(user.rows[0].lat);
      const lng = parseFloat(user.rows[0].lng);
      params.push(lat, lng);

      let scoreExpr = `
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(e.lat)) * cos(radians(e.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(e.lat)))) AS distance_km,
        CASE WHEN e.club_id = ANY($${paramIndex + 2}::uuid[]) THEN 10 ELSE 0 END +
        CASE WHEN e.lat IS NOT NULL THEN 5 / (1 + (6371 * acos(cos(radians($${paramIndex})) * cos(radians(e.lat)) * cos(radians(e.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(e.lat))))) ELSE 0 END
      `;
      paramIndex += 2;

      if (clubIds.length > 0) {
        params.push(clubIds);
      } else {
        params.push([]);
      }
      paramIndex++;

      queryStr = `
        SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar,
          ${scoreExpr} AS relevance_score
        FROM events e
        INNER JOIN users u ON e.created_by = u.id
        WHERE ${whereClause} AND e.lat IS NOT NULL AND e.lng IS NOT NULL
        ORDER BY relevance_score DESC, e.start_date ASC
        LIMIT $${paramIndex}
      `;
      params.push(limit);
    } else {
      if (clubIds.length > 0) {
        params.push(clubIds);
        conditions.push(`e.club_id = ANY($${paramIndex}::uuid[])`);
        paramIndex++;
      }

      const finalWhere = conditions.join(' AND ');

      queryStr = `
        SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar,
          CASE WHEN e.club_id = ANY($1::uuid[]) THEN 10 ELSE 0 END +
          e.participant_count * 0.01 AS relevance_score
        FROM events e
        INNER JOIN users u ON e.created_by = u.id
        WHERE ${finalWhere}
        ORDER BY relevance_score DESC, e.start_date ASC
        LIMIT $2
      `;
      const result = await this.pool.query(queryStr, [clubIds.length > 0 ? clubIds : [], limit]);
      return result.rows;
    }

    const result = await this.pool.query(queryStr, params);
    return result.rows;
  }
}

export default RecommendationService;
