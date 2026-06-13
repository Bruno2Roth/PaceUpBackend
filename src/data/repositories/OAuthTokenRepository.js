import BaseRepository from './BaseRepository.js';

export class OAuthTokenRepository extends BaseRepository {
  constructor() {
    super('oauth_tokens');
  }

  async findByAccessToken(token) {
    const result = await this.pool.query(`
      SELECT * FROM oauth_tokens WHERE access_token = $1
    `, [token]);
    return result.rows[0];
  }

  async findByUser(userId) {
    const result = await this.pool.query(`
      SELECT ot.*, oa.name AS app_name
      FROM oauth_tokens ot
      INNER JOIN oauth_apps oa ON ot.app_id = oa.id
      WHERE ot.user_id = $1
      ORDER BY ot.created_at DESC
    `, [userId]);
    return result.rows;
  }

  async findByRefreshToken(token) {
    const result = await this.pool.query(`
      SELECT * FROM oauth_tokens WHERE refresh_token = $1
    `, [token]);
    return result.rows[0];
  }

  async revokeByUser(userId, appId) {
    const result = await this.pool.query(`
      DELETE FROM oauth_tokens WHERE user_id = $1 AND app_id = $2 RETURNING *
    `, [userId, appId]);
    return result.rows;
  }
}

export default OAuthTokenRepository;
