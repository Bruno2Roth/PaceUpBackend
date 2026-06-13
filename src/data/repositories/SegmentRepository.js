import BaseRepository from './BaseRepository.js';

export class SegmentRepository extends BaseRepository {
  constructor() {
    super('segments');
  }

  async findNearby(lat, lng, radiusKm, limit = 20, offset = 0) {
    const query = `
      SELECT *, (
        6371 * acos(
          cos(radians($1)) * cos(radians(start_lat)) *
          cos(radians(start_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(start_lat))
        )
      ) AS distance_km
      FROM segments
      WHERE is_deleted = FALSE
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(start_lat)) *
            cos(radians(start_lng) - radians($2)) +
            sin(radians($1)) * sin(radians(start_lat))
          )
        ) <= $3
      ORDER BY distance_km ASC
      LIMIT $4 OFFSET $5
    `;
    const result = await this.pool.query(query, [lat, lng, radiusKm, limit, offset]);
    return result.rows;
  }

  async findByType(type, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM segments
      WHERE segment_type = $1 AND is_deleted = FALSE
      ORDER BY activity_count DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [type, limit, offset]);
    return result.rows;
  }

  async findCreator(creatorId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM segments
      WHERE creator_id = $1 AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [creatorId, limit, offset]);
    return result.rows;
  }

  async findByRouteId(routeId) {
    const query = `
      SELECT * FROM segments
      WHERE route_id = $1 AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [routeId]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM segments WHERE id = $1 AND is_deleted = FALSE';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async incrementActivityCount(id) {
    const query = `
      UPDATE segments
      SET activity_count = activity_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [id]);
  }

  async incrementEffortCount(id) {
    const query = `
      UPDATE segments
      SET effort_count = effort_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [id]);
  }
}

export default SegmentRepository;
