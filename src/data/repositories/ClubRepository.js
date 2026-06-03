import BaseRepository from './BaseRepository.js';

export class ClubRepository extends BaseRepository {
  constructor() {
    super('clubs');
  }

  async findPublicClubs(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM clubs
      WHERE is_private = false AND deleted_at IS NULL
      ORDER BY member_count DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findByFounderId(founderId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM clubs
      WHERE founder_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [founderId, limit, offset]);
    return result.rows;
  }

  async searchClubs(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM clubs
      WHERE (name ILIKE $1 OR description ILIKE $1) AND is_private = false AND deleted_at IS NULL
      ORDER BY member_count DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async updateMemberCount(clubId, count) {
    const query = `
      UPDATE clubs
      SET member_count = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [clubId, count]);
    return result.rows[0];
  }
}

export default ClubRepository;
