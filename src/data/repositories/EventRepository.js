import BaseRepository from './BaseRepository.js';

export class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  async findAll(limit = 20, offset = 0) {
    const query = `
      SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar
      FROM events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.is_canceled = FALSE
      ORDER BY e.start_date DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findUpcoming(limit = 20, offset = 0) {
    const query = `
      SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar
      FROM events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.start_date > CURRENT_TIMESTAMP AND e.is_canceled = FALSE
      ORDER BY e.start_date ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findByClub(clubId) {
    const query = `
      SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar
      FROM events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.club_id = $1
      ORDER BY e.start_date DESC
    `;
    const result = await this.pool.query(query, [clubId]);
    return result.rows;
  }

  async findByType(eventType, limit = 20, offset = 0) {
    const query = `
      SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar
      FROM events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.event_type = $1 AND e.is_canceled = FALSE
      ORDER BY e.start_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [eventType, limit, offset]);
    return result.rows;
  }

  async findNearby(lat, lng, radiusKm, limit = 20, offset = 0) {
    const query = `
      SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar, (
        6371 * acos(
          cos(radians($1)) * cos(radians(e.lat)) *
          cos(radians(e.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(e.lat))
        )
      ) AS distance_km
      FROM events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.lat IS NOT NULL AND e.lng IS NOT NULL
        AND e.is_canceled = FALSE
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(e.lat)) *
            cos(radians(e.lng) - radians($2)) +
            sin(radians($1)) * sin(radians(e.lat))
          )
        ) <= $3
      ORDER BY distance_km ASC, e.start_date ASC
      LIMIT $4 OFFSET $5
    `;
    const result = await this.pool.query(query, [lat, lng, radiusKm, limit, offset]);
    return result.rows;
  }
}

export default EventRepository;
