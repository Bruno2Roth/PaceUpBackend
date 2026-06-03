import BaseRepository from './BaseRepository.js';

export class SegmentRepository extends BaseRepository {
  constructor() {
    super('segments');
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
    const query = 'SELECT * FROM segments WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

export default SegmentRepository;
