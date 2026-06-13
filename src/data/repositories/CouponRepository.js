import BaseRepository from './BaseRepository.js';

export class CouponRepository extends BaseRepository {
  constructor() {
    super('coupons');
  }

  async findByCode(code) {
    return this.findOne('code = $1', [code]);
  }

  async findValid(code) {
    return this.pool.query(
      `SELECT * FROM coupons
       WHERE code = $1
         AND is_active = TRUE
         AND valid_from <= CURRENT_TIMESTAMP
         AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
         AND (max_redemptions = 0 OR current_redemptions < max_redemptions)
       LIMIT 1`, [code]
    ).then(r => r.rows[0]);
  }

  async incrementRedemptions(id) {
    return this.pool.query(
      'UPDATE coupons SET current_redemptions = current_redemptions + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    ).then(r => r.rows[0]);
  }
}
export default CouponRepository;
