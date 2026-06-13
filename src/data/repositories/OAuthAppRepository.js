import BaseRepository from './BaseRepository.js';

export class OAuthAppRepository extends BaseRepository {
  constructor() {
    super('oauth_apps');
  }

  async findByClientId(clientId) {
    const result = await this.pool.query(`
      SELECT * FROM oauth_apps WHERE client_id = $1
    `, [clientId]);
    return result.rows[0];
  }

  async findByOwner(ownerId) {
    const result = await this.pool.query(`
      SELECT * FROM oauth_apps WHERE owner_id = $1 ORDER BY created_at DESC
    `, [ownerId]);
    return result.rows;
  }
}

export default OAuthAppRepository;
