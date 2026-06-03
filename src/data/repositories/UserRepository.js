import BaseRepository from './BaseRepository.js';
import User from '../../application/entities/User.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const user = await this.findOne('email = $1', [email]);
    return user;
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
      SELECT * FROM users
      WHERE (name ILIKE $1 OR email ILIKE $1) AND deleted_at IS NULL
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

export default UserRepository;
