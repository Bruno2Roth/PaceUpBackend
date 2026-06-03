import BaseRepository from './BaseRepository.js';

export class ChallengeRepository extends BaseRepository {
  constructor() {
    super('challenges');
  }

  async findActiveChall (limit = 20, offset = 0) {
    const query = `
      SELECT * FROM challenges
      WHERE is_active = true AND end_date > CURRENT_TIMESTAMP AND deleted_at IS NULL
      ORDER BY start_date DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findByClubId(clubId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM challenges
      WHERE club_id = $1 AND deleted_at IS NULL
      ORDER BY start_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [clubId, limit, offset]);
    return result.rows;
  }

  async findByCreatorId(creatorId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM challenges
      WHERE creator_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [creatorId, limit, offset]);
    return result.rows;
  }

  async searchChallenges(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM challenges
      WHERE (title ILIKE $1 OR description ILIKE $1) AND deleted_at IS NULL
      ORDER BY player_count DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM challenges WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async updateParticipantCount(challengeId, count) {
    const query = `
      UPDATE challenges
      SET participant_count = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [challengeId, count]);
    return result.rows[0];
  }
}

export default ChallengeRepository;
