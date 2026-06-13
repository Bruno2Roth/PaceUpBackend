import BaseRepository from './BaseRepository.js';
import crypto from 'crypto';

export class VerificationTokenRepository extends BaseRepository {
  constructor() {
    super('email_verification_tokens');
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async createToken(userId, type = 'email_verification', expiresInHours = 24) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expiresInHours * 3600000);
    const query = `
      INSERT INTO email_verification_tokens (user_id, token, type, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, token, type, expiresAt]);
    return result.rows[0];
  }

  async findByToken(token) {
    const query = `
      SELECT * FROM email_verification_tokens
      WHERE token = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    const result = await this.pool.query(query, [token]);
    return result.rows[0];
  }

  async markAsUsed(token) {
    const query = `
      UPDATE email_verification_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE token = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [token]);
    return result.rows[0];
  }

  async invalidateUserTokens(userId, type = 'email_verification') {
    return this.pool.query(
      `UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
      [userId, type],
    );
  }
}

export default VerificationTokenRepository;
