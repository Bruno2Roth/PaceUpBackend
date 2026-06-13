import BaseRepository from './BaseRepository.js';

export class ReferralRepository extends BaseRepository {
  constructor() {
    super('referrals');
  }

  async findByReferrer(referrerId) {
    return this.pool.query(
      `SELECT r.*, u.name as referred_name, u.profile_picture_url as referred_avatar
       FROM referrals r
       LEFT JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC`, [referrerId]
    ).then(r => r.rows);
  }

  async findByCode(code) {
    return this.findOne('referral_code = $1', [code]);
  }

  async countByReferrer(referrerId) {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1 AND status = 'completed'",
      [referrerId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
export default ReferralRepository;
