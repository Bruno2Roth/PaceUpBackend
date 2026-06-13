import BaseRepository from './BaseRepository.js';

export class TrainingSimulationRepository extends BaseRepository {
  constructor() {
    super('training_simulations');
  }

  async findByUser(userId) {
    const result = await this.pool.query(`
      SELECT * FROM training_simulations WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
  }
}

export default TrainingSimulationRepository;
