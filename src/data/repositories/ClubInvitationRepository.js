import BaseRepository from './BaseRepository.js';

export class ClubInvitationRepository extends BaseRepository {
  constructor() {
    super('club_invitations');
  }

  async findPendingByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT ci.*, c.name AS club_name, c.logo_url AS club_logo,
        u.name AS invited_by_name
      FROM club_invitations ci
      INNER JOIN clubs c ON ci.club_id = c.id
      LEFT JOIN users u ON ci.invited_by = u.id
      WHERE ci.user_id = $1 AND ci.status = 'pending'
      ORDER BY ci.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findPendingByClub(clubId, limit = 20, offset = 0) {
    const query = `
      SELECT ci.*, u.name AS user_name, u.email AS user_email
      FROM club_invitations ci
      INNER JOIN users u ON ci.user_id = u.id
      WHERE ci.club_id = $1 AND ci.status = 'pending'
      ORDER BY ci.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [clubId, limit, offset]);
    return result.rows;
  }

  async findPending(clubId, userId) {
    const query = `
      SELECT * FROM club_invitations
      WHERE club_id = $1 AND user_id = $2 AND status = 'pending'
    `;
    const result = await this.pool.query(query, [clubId, userId]);
    return result.rows[0];
  }

  async accept(invitationId) {
    const query = `
      UPDATE club_invitations SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `;
    const result = await this.pool.query(query, [invitationId]);
    return result.rows[0];
  }

  async reject(invitationId) {
    const query = `
      UPDATE club_invitations SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `;
    const result = await this.pool.query(query, [invitationId]);
    return result.rows[0];
  }
}

export default ClubInvitationRepository;
