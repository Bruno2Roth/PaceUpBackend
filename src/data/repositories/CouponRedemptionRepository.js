import BaseRepository from './BaseRepository.js';

export class CouponRedemptionRepository extends BaseRepository {
  constructor() {
    super('coupon_redemptions');
  }

  async countByUserAndCoupon(userId, couponId) {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM coupon_redemptions WHERE user_id = $1 AND coupon_id = $2',
      [userId, couponId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
export default CouponRedemptionRepository;
