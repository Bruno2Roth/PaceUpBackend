import BaseRepository from './BaseRepository.js';

export class TrainingWizardSessionRepository extends BaseRepository {
  constructor() {
    super('training_wizard_sessions');
  }

  async findActiveByUserId(userId) {
    return this.findOne('user_id = $1 AND status = $2', [userId, 'in_progress']);
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    return this.findMany('user_id = $1', [userId], limit, offset);
  }

  async updateStep(sessionId, step) {
    return this.update(sessionId, { current_step: step });
  }

  async complete(sessionId) {
    return this.update(sessionId, { status: 'completed' });
  }

  async cancel(sessionId) {
    return this.update(sessionId, { status: 'cancelled' });
  }
}

export class TrainingWizardAnswerRepository extends BaseRepository {
  constructor() {
    super('training_wizard_answers');
  }

  async findBySessionId(sessionId) {
    const query = `SELECT * FROM ${this.tableName} WHERE session_id = $1 ORDER BY created_at ASC`;
    const result = await this.pool.query(query, [sessionId]);
    return result.rows;
  }

  async findBySessionAndKey(sessionId, questionKey) {
    return this.findOne('session_id = $1 AND question_key = $2', [sessionId, questionKey]);
  }

  async deleteBySessionId(sessionId) {
    const query = `DELETE FROM ${this.tableName} WHERE session_id = $1`;
    const result = await this.pool.query(query, [sessionId]);
    return result.rowCount;
  }
}
