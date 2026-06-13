import BaseRepository from './BaseRepository.js';

export class TrainingPlanRepository extends BaseRepository {
  constructor() {
    super('training_plans');
  }

  async findActiveByUserId(userId) {
    const query = `
      SELECT * FROM training_plans
      WHERE user_id = $1
        AND is_active = TRUE
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM training_plans
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async findNonDeletedById(id) {
    const query = 'SELECT * FROM training_plans WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

export class TrainingPlanWeekRepository extends BaseRepository {
  constructor() {
    super('training_plan_weeks');
  }

  async findByPlanId(planId) {
    const query = `
      SELECT * FROM training_plan_weeks
      WHERE plan_id = $1
      ORDER BY week_number ASC
    `;
    const result = await this.pool.query(query, [planId]);
    return result.rows;
  }
}

export class TrainingPlanSessionRepository extends BaseRepository {
  constructor() {
    super('training_plan_sessions');
  }

  async findByWeekId(weekId) {
    const query = `
      SELECT * FROM training_plan_sessions
      WHERE week_id = $1
      ORDER BY day_of_week ASC
    `;
    const result = await this.pool.query(query, [weekId]);
    return result.rows;
  }

  async findIncompleteByPlan(planId) {
    const query = `
      SELECT s.* FROM training_plan_sessions s
      INNER JOIN training_plan_weeks w ON s.week_id = w.id
      WHERE w.plan_id = $1
        AND s.is_completed = FALSE
        AND s.session_type != 'rest'
        AND s.day_of_week <= EXTRACT(DOW FROM CURRENT_DATE)
      ORDER BY w.week_number ASC, s.day_of_week ASC
    `;
    const result = await this.pool.query(query, [planId]);
    return result.rows;
  }

  async getCompletionRate(planId) {
    const query = `
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_completed = TRUE)::int as completed
      FROM training_plan_sessions s
      INNER JOIN training_plan_weeks w ON s.week_id = w.id
      WHERE w.plan_id = $1 AND s.session_type != 'rest'
    `;
    const result = await this.pool.query(query, [planId]);
    return result.rows[0];
  }
}

export { TrainingPlanRepository as default };
