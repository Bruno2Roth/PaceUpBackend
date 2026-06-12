import BaseRepository from './BaseRepository.js';
import User from '../../application/entities/User.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.findOne('email = $1', [email]);
  }

  async findActiveUsers(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM users
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async findByRole(role, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM users
      WHERE role = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [role, limit, offset]);
    return result.rows;
  }

  async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async searchUsers(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT id, name, username, profile_picture_url, bio, city, country
      FROM users
      WHERE deleted_at IS NULL
        AND (
          name ILIKE $1
          OR username ILIKE $1
          OR city ILIKE $1
        )
      ORDER BY
        CASE
          WHEN name ILIKE $2 THEN 0
          WHEN username ILIKE $2 THEN 1
          WHEN city ILIKE $1 THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT $3 OFFSET $4
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, `${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async updateStreak(userId, currentStreak, maxStreak, lastActivityDate) {
    const query = `
      UPDATE users
      SET current_streak = $2, max_streak = $3, last_activity_date = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, current_streak, max_streak, last_activity_date
    `;
    const result = await this.pool.query(query, [userId, currentStreak, maxStreak, lastActivityDate]);
    return result.rows[0];
  }

  async updatePersonalBests(userId, personalBests) {
    const query = `
      UPDATE users
      SET personal_bests = $2::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [userId, JSON.stringify(personalBests)]);
  }
}

export default UserRepository;
