import UserRepository from '../../data/repositories/UserRepository.js';
import RouteRepository from '../../data/repositories/RouteRepository.js';
import EventRepository from '../../data/repositories/EventRepository.js';
import ClubRepository from '../../data/repositories/ClubRepository.js';

export class DiscoveryService {
  constructor() {
    this.userRepository = new UserRepository();
    this.routeRepository = new RouteRepository();
    this.eventRepository = new EventRepository();
    this.clubRepository = new ClubRepository();
  }

  async discoverUsers(query = {}) {
    const { q, lat, lng, radiusKm = 50, minActivities, city, country, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const conditions = ['u.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR u.city ILIKE $${paramIndex} OR u.country ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (city) {
      conditions.push(`u.city ILIKE $${paramIndex}`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (country) {
      conditions.push(`u.country ILIKE $${paramIndex}`);
      params.push(`%${country}%`);
      paramIndex++;
    }

    if (minActivities) {
      conditions.push(`(SELECT COUNT(*) FROM activities a WHERE a.user_id = u.id AND a.deleted_at IS NULL) >= $${paramIndex}`);
      params.push(parseInt(minActivities, 10));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let queryStr;
    if (lat && lng) {
      queryStr = `
        SELECT u.id, u.name, u.username, u.profile_picture_url, u.bio, u.city, u.country, u.lat, u.lng,
          (6371 * acos(cos(radians($${paramIndex})) * cos(radians(u.lat)) * cos(radians(u.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(u.lat)))) AS distance_km
        FROM users u
        WHERE ${whereClause} AND u.lat IS NOT NULL AND u.lng IS NOT NULL
        ORDER BY distance_km ASC
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `;
      params.push(parseFloat(lat), parseFloat(lng), limit, offset);
    } else {
      queryStr = `
        SELECT u.id, u.name, u.username, u.profile_picture_url, u.bio, u.city, u.country
        FROM users u
        WHERE ${whereClause}
        ORDER BY u.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
    }

    const result = await this.userRepository.pool.query(queryStr, params);
    return result.rows;
  }

  async discoverRoutes(query = {}) {
    const { lat, lng, radiusKm = 50, minDistance, maxDistance, surfaceType, city, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const conditions = ['r.is_public = TRUE', 'r.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (minDistance) {
      conditions.push(`r.distance_m >= $${paramIndex}`);
      params.push(parseFloat(minDistance) * 1000);
      paramIndex++;
    }

    if (maxDistance) {
      conditions.push(`r.distance_m <= $${paramIndex}`);
      params.push(parseFloat(maxDistance) * 1000);
      paramIndex++;
    }

    if (surfaceType) {
      conditions.push(`r.surface_type ILIKE $${paramIndex}`);
      params.push(surfaceType);
      paramIndex++;
    }

    if (city) {
      conditions.push(`(r.city ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let queryStr;
    if (lat && lng) {
      queryStr = `
        SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar,
          (6371 * acos(cos(radians($${paramIndex})) * cos(radians(r.lat)) * cos(radians(r.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(r.lat)))) AS distance_km
        FROM routes r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${whereClause} AND r.lat IS NOT NULL AND r.lng IS NOT NULL
        ORDER BY distance_km ASC, r.activity_count DESC
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `;
      params.push(parseFloat(lat), parseFloat(lng), limit, offset);
    } else {
      queryStr = `
        SELECT r.*, u.name AS author_name, u.username, u.profile_picture_url AS author_avatar
        FROM routes r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${whereClause}
        ORDER BY r.activity_count DESC, r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
    }

    const result = await this.routeRepository.pool.query(queryStr, params);
    return result.rows;
  }

  async discoverEvents(query = {}) {
    const { lat, lng, radiusKm = 50, eventType, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const conditions = ['e.is_canceled = FALSE'];
    const params = [];
    let paramIndex = 1;

    if (eventType) {
      conditions.push(`e.event_type = $${paramIndex}`);
      params.push(eventType);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`e.start_date >= $${paramIndex}`);
      params.push(new Date(dateFrom));
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`e.end_date <= $${paramIndex}`);
      params.push(new Date(dateTo));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let queryStr;
    if (lat && lng) {
      queryStr = `
        SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar,
          (6371 * acos(cos(radians($${paramIndex})) * cos(radians(e.lat)) * cos(radians(e.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(e.lat)))) AS distance_km
        FROM events e
        INNER JOIN users u ON e.created_by = u.id
        WHERE ${whereClause} AND e.lat IS NOT NULL AND e.lng IS NOT NULL
        ORDER BY distance_km ASC, e.start_date ASC
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `;
      params.push(parseFloat(lat), parseFloat(lng), limit, offset);
    } else {
      queryStr = `
        SELECT e.*, u.name AS creator_name, u.username, u.profile_picture_url AS creator_avatar
        FROM events e
        INNER JOIN users u ON e.created_by = u.id
        WHERE ${whereClause}
        ORDER BY e.start_date ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
    }

    const result = await this.eventRepository.pool.query(queryStr, params);
    return result.rows;
  }

  async discoverClubs(query = {}) {
    const { lat, lng, radiusKm = 50, minMembers, city, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const conditions = ['c.is_private = FALSE', 'c.deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (minMembers) {
      conditions.push(`c.member_count >= $${paramIndex}`);
      params.push(parseInt(minMembers, 10));
      paramIndex++;
    }

    if (city) {
      conditions.push(`(c.city ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let queryStr;
    if (lat && lng) {
      queryStr = `
        SELECT c.*, u.name AS founder_name,
          (6371 * acos(cos(radians($${paramIndex})) * cos(radians(c.lat)) * cos(radians(c.lng) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(c.lat)))) AS distance_km
        FROM clubs c
        LEFT JOIN users u ON c.founder_id = u.id
        WHERE ${whereClause} AND c.lat IS NOT NULL AND c.lng IS NOT NULL
        ORDER BY distance_km ASC, c.member_count DESC
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `;
      params.push(parseFloat(lat), parseFloat(lng), limit, offset);
    } else {
      queryStr = `
        SELECT c.*, u.name AS founder_name
        FROM clubs c
        LEFT JOIN users u ON c.founder_id = u.id
        WHERE ${whereClause}
        ORDER BY c.member_count DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
    }

    const result = await this.clubRepository.pool.query(queryStr, params);
    return result.rows;
  }
}

export default DiscoveryService;
