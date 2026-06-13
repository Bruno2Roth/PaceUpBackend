import BaseRepository from './BaseRepository.js';

export class MarketplaceListingRepository extends BaseRepository {
  constructor() {
    super('marketplace_listings');
  }

  async findByType(type) {
    const result = await this.pool.query(`
      SELECT * FROM marketplace_listings
      WHERE listing_type = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `, [type]);
    return result.rows;
  }

  async findActive() {
    const result = await this.pool.query(`
      SELECT * FROM marketplace_listings
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async findByProvider(providerId) {
    const result = await this.pool.query(`
      SELECT * FROM marketplace_listings
      WHERE provider_id = $1
      ORDER BY created_at DESC
    `, [providerId]);
    return result.rows;
  }
}

export default MarketplaceListingRepository;
