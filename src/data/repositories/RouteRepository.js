import BaseRepository from './BaseRepository.js';

export class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  async findPublicRoutes(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM routes
      WHERE is_public = true AND deleted_at IS NULL
      ORDER BY activity_count DESC
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

  async searchRoutes(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM routes
      WHERE (name ILIKE $1 OR description ILIKE $1) AND is_public = true AND deleted_at IS NULL
      ORDER BY activity_count DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM routes WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

export default RouteRepository;
