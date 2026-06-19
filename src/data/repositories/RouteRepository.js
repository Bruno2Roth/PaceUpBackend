import BaseRepository from './BaseRepository.js';

export class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM routes WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async findPublic(limit = 20, offset = 0) {
    const query = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.is_public = TRUE AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM routes
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findPopular(limit = 20) {
    const query = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.is_public = TRUE AND r.deleted_at IS NULL
      ORDER BY r.activity_count DESC, r.created_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async findNearby(lat, lng, radiusKm = 10, limit = 20) {
    const query = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.is_public = TRUE
        AND r.deleted_at IS NULL
        AND r.gps_points IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          ST_SetSRID(ST_MakePoint(
            (r.gps_points->0->>'lng')::float,
            (r.gps_points->0->>'lat')::float
          ), 4326)::geography,
          $3 * 1000
        )
      ORDER BY r.activity_count DESC
      LIMIT $4
    `;
    const result = await this.pool.query(query, [lat, lng, radiusKm, limit]);
    return result.rows;
  }

  async findFavorites(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM routes
      WHERE user_id = $1 AND is_favorite = TRUE AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findByDistanceRange(minDistance, maxDistance, limit = 20, offset = 0) {
    const query = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.is_public = TRUE
        AND r.deleted_at IS NULL
        AND r.distance_m >= $1
        AND r.distance_m <= $2
      ORDER BY r.distance_m ASC
      LIMIT $3 OFFSET $4
    `;
    const result = await this.pool.query(query, [minDistance, maxDistance, limit, offset]);
    return result.rows;
  }

  async searchRoutes({ q, city, difficulty, limit = 20, offset = 0 }) {
    const conditions = ['r.is_public = TRUE', 'r.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (q && q.trim()) {
      conditions.push(`(r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.city ILIKE $${paramIndex})`);
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (city && city.trim()) {
      conditions.push(`r.city ILIKE $${paramIndex}`);
      params.push(`%${city.trim()}%`);
      paramIndex++;
    }

    if (difficulty) {
      conditions.push(`r.difficulty_level = $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const query = `
      SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
      FROM routes r
      INNER JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async incrementActivityCount(routeId) {
    const query = `
      UPDATE routes SET activity_count = activity_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [routeId]);
  }
}

export default RouteRepository;
