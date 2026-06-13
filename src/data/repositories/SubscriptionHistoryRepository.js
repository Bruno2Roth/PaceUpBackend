import BaseRepository from './BaseRepository.js';

export class SubscriptionHistoryRepository extends BaseRepository {
  constructor() {
    super('subscription_history');
  }

  async findByUserId(userId) {
    return this.findMany('user_id = $1', [userId], 50, 0);
  }
}
export default SubscriptionHistoryRepository;
