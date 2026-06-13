import BaseRepository from './BaseRepository.js';

export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super('subscriptions');
  }

  async findActiveByUserId(userId) {
    const query = `
      SELECT s.*, sp.name AS plan_name, sp.code AS plan_code, sp.features
      FROM subscriptions s
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
        AND s.status = 'active'
        AND s.current_period_end > CURRENT_TIMESTAMP
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async findByUserId(userId) {
    const query = `
      SELECT s.*, sp.name AS plan_name, sp.code AS plan_code
      FROM subscriptions s
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async findAllActiveUserIds() {
    const query = `
      SELECT DISTINCT user_id
      FROM subscriptions
      WHERE status = 'active'
        AND current_period_end > CURRENT_TIMESTAMP
    `;
    const result = await this.pool.query(query);
    return result.rows.map(row => row.user_id);
  }
}

export default SubscriptionRepository;
