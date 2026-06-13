import BaseRepository from './BaseRepository.js';

export class SubscriptionPlanRepository extends BaseRepository {
  constructor() {
    super('subscription_plans');
  }

  async findActive() {
    return this.findMany('is_active = $1', [true], 100, 0);
  }

  async findByCode(code) {
    return this.findOne('code = $1', [code]);
  }
}
export default SubscriptionPlanRepository;
