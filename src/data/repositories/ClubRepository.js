import BaseRepository from './BaseRepository.js';

export class ClubRepository extends BaseRepository {
  constructor() {
    super('clubs');
  }

  async findPublicClubs(limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT c.*, u.name AS founder_name
      FROM clubs c
      LEFT JOIN users u ON c.founder_id = u.id
      WHERE c.is_private = false AND c.deleted_at IS NULL
      ORDER BY c.member_count DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  async findByFounderId(founderId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT * FROM clubs
      WHERE founder_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [founderId, limit, offset]);
    return result.rows;
  }

  async searchClubs(searchTerm, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT c.*, u.name AS founder_name
      FROM clubs c
      LEFT JOIN users u ON c.founder_id = u.id
      WHERE (c.name ILIKE $1 OR c.description ILIKE $1)
        AND c.is_private = false AND c.deleted_at IS NULL
      ORDER BY c.member_count DESC
      LIMIT $2 OFFSET $3
    `, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const result = await this.pool.query('SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0];
  }

  async updateMemberCount(clubId, count) {
    const result = await this.pool.query(`
      UPDATE clubs SET member_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *
    `, [clubId, count]);
    return result.rows[0];
  }

  async addMember(clubId, userId, role = 'member') {
    const result = await this.pool.query(`
      INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)
      ON CONFLICT (user_id, club_id) DO NOTHING RETURNING *
    `, [clubId, userId, role]);
    return result.rows[0];
  }

  async removeMember(clubId, userId) {
    const result = await this.pool.query(`
      DELETE FROM club_members WHERE club_id = $1 AND user_id = $2 RETURNING *
    `, [clubId, userId]);
    return result.rows[0];
  }

  async isMember(clubId, userId) {
    const result = await this.pool.query(`
      SELECT * FROM club_members WHERE club_id = $1 AND user_id = $2
    `, [clubId, userId]);
    return result.rows.length > 0;
  }

  async getMemberCount(clubId) {
    const result = await this.pool.query(`
      SELECT COUNT(*)::int as count FROM club_members WHERE club_id = $1
    `, [clubId]);
    return result.rows[0].count;
  }

  async getMembers(clubId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.username, u.profile_picture_url, u.bio, u.city,
        cm.role, cm.joined_at
      FROM club_members cm
      INNER JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1
      ORDER BY cm.role = 'admin' DESC, cm.joined_at ASC
      LIMIT $2 OFFSET $3
    `, [clubId, limit, offset]);
    return result.rows;
  }

  async getMemberRole(clubId, userId) {
    const result = await this.pool.query(`
      SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2
    `, [clubId, userId]);
    return result.rows[0]?.role || null;
  }

  async getClubActivities(clubId, limit = 20, offset = 0) {
    const result = await this.pool.query(`
      SELECT a.*, u.name AS author_name, u.profile_picture_url AS author_avatar
      FROM activities a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.club_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.start_time DESC
      LIMIT $2 OFFSET $3
    `, [clubId, limit, offset]);
    return result.rows;
  }

  async getUserClubs(userId) {
    const result = await this.pool.query(`
      SELECT c.*, cm.role AS member_role, cm.joined_at
      FROM clubs c
      INNER JOIN club_members cm ON c.id = cm.club_id
      WHERE cm.user_id = $1 AND c.deleted_at IS NULL
      ORDER BY cm.joined_at DESC
    `, [userId]);
    return result.rows;
  }
}

export default ClubRepository;
