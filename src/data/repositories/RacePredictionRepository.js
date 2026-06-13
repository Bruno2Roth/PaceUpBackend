import BaseRepository from './BaseRepository.js';

export class RacePredictionRepository extends BaseRepository {
  constructor() {
    super('race_predictions');
  }

  async findByUser(userId) {
    const result = await this.pool.query(`
      SELECT * FROM race_predictions WHERE user_id = $1 ORDER BY distance ASC
    `, [userId]);
    return result.rows;
  }

  async findByUserAndDistance(userId, distance) {
    const result = await this.pool.query(`
      SELECT * FROM race_predictions WHERE user_id = $1 AND distance = $2
    `, [userId, distance]);
    return result.rows[0];
  }

  async upsert(userId, distance, data) {
    const result = await this.pool.query(`
      INSERT INTO race_predictions (user_id, distance, predicted_seconds, confidence, based_on_activities, based_on_v02max)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, distance)
      DO UPDATE SET
        predicted_seconds = EXCLUDED.predicted_seconds,
        confidence = EXCLUDED.confidence,
        based_on_activities = EXCLUDED.based_on_activities,
        based_on_v02max = EXCLUDED.based_on_v02max,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, distance, data.predictedSeconds, data.confidence, data.basedOnActivities, data.basedOnV02max]);
    return result.rows[0];
  }
}

export default RacePredictionRepository;
