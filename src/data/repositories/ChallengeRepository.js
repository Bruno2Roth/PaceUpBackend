import BaseRepository from './BaseRepository.js';

export class ChallengeRepository extends BaseRepository {
  constructor() {
    super('challenges');
  }

  async findActiveChallenges(limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT ch.*, u.name AS creator_name
      FROM challenges ch
      LEFT JOIN users u ON ch.creator_id = u.id
      WHERE ch.is_active = true AND ch.end_date > CURRENT_TIMESTAMP AND ch.deleted_at IS NULL
      ORDER BY ch.start_date DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  async findByClubId(clubId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT ch.*, u.name AS creator_name
      FROM challenges ch
      LEFT JOIN users u ON ch.creator_id = u.id
      WHERE ch.club_id = $1 AND ch.deleted_at IS NULL
      ORDER BY ch.start_date DESC
      LIMIT $2 OFFSET $3
    `, [clubId, limit, offset]);
    return result.rows;
  }

  async findByCreatorId(creatorId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT * FROM challenges
      WHERE creator_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [creatorId, limit, offset]);
    return result.rows;
  }

  async searchChallenges(searchTerm, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT ch.*, u.name AS creator_name
      FROM challenges ch
      LEFT JOIN users u ON ch.creator_id = u.id
      WHERE (ch.title ILIKE $1 OR ch.description ILIKE $1) AND ch.deleted_at IS NULL
      ORDER BY ch.participant_count DESC
      LIMIT $2 OFFSET $3
    `, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const result = await this.pool.query('SELECT * FROM challenges WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0];
  }

  async updateParticipantCount(challengeId, count) {
    const result = await this.pool.query(`
      UPDATE challenges SET participant_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *
    `, [challengeId, count]);
    return result.rows[0];
  }

  async addParticipant(challengeId, userId) {
    const result = await this.pool.query(`
      INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)
      ON CONFLICT (user_id, challenge_id) DO NOTHING RETURNING *
    `, [challengeId, userId]);
    return result.rows[0];
  }

  async removeParticipant(challengeId, userId) {
    const result = await this.pool.query(`
      DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2 RETURNING *
    `, [challengeId, userId]);
    return result.rows[0];
  }

  async isParticipant(challengeId, userId) {
    const result = await this.pool.query(`
      SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2
    `, [challengeId, userId]);
    return result.rows.length > 0;
  }

  async getParticipantCount(challengeId) {
    const result = await this.pool.query(`
      SELECT COUNT(*)::int as count FROM challenge_participants WHERE challenge_id = $1
    `, [challengeId]);
    return result.rows[0].count;
  }

  async getParticipants(challengeId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        cp.progress, cp.joined_at
      FROM challenge_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = $1
      ORDER BY cp.progress DESC, cp.joined_at ASC
      LIMIT $2 OFFSET $3
    `, [challengeId, limit, offset]);
    return result.rows;
  }

  async updateProgress(challengeId, userId, progress) {
    const result = await this.pool.query(`
      UPDATE challenge_participants SET progress = $3 WHERE challenge_id = $1 AND user_id = $2 RETURNING *
    `, [challengeId, userId, progress]);
    return result.rows[0];
  }

  async getLeaderboard(challengeId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url,
        cp.progress, ROW_NUMBER() OVER (ORDER BY cp.progress DESC) as rank
      FROM challenge_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = $1
      ORDER BY cp.progress DESC
      LIMIT $2 OFFSET $3
    `, [challengeId, limit, offset]);
    return result.rows;
  }

  async getUserChallenges(userId, status = 'active') {
    let extraCondition = '';
    if (status === 'active') {
      extraCondition = 'AND ch.end_date > CURRENT_TIMESTAMP AND ch.is_active = true';
    } else if (status === 'completed') {
      extraCondition = 'AND ch.end_date <= CURRENT_TIMESTAMP';
    }

    const result = await this.pool.query(`
      SELECT ch.*, cp.progress, cp.joined_at
      FROM challenges ch
      INNER JOIN challenge_participants cp ON ch.id = cp.challenge_id
      WHERE cp.user_id = $1 ${extraCondition} AND ch.deleted_at IS NULL
      ORDER BY ch.end_date DESC
    `, [userId]);
    return result.rows;
  }

  async getUserProgressOnDate(challengeId, userId, sinceDate) {
    const result = await this.pool.query(`
      SELECT COALESCE(SUM(a.distance_m), 0) as total_distance,
        COALESCE(SUM(a.duration_seconds), 0) as total_duration,
        COALESCE(SUM(a.elevation_gain_m), 0) as total_elevation,
        COUNT(*)::int as activity_count
      FROM activities a
      WHERE a.user_id = $1
        AND a.deleted_at IS NULL
        AND a.start_time >= $2
        AND (a.is_private = false OR a.is_private = true)
    `, [userId, sinceDate]);
    return result.rows[0];
  }
}

export default ChallengeRepository;
