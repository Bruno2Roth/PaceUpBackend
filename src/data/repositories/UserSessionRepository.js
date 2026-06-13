import BaseRepository from './BaseRepository.js';

export class UserSessionRepository extends BaseRepository {
  constructor() {
    super('user_sessions');
  }

  async createSession(userId, ip, userAgent) {
    const result = await this.pool.query(`
      INSERT INTO user_sessions (user_id, session_start, ip_address, user_agent)
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3)
      RETURNING *
    `, [userId, ip, userAgent]);
    return result.rows[0];
  }

  async endSession(sessionId) {
    const result = await this.pool.query(`
      UPDATE user_sessions
      SET session_end = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [sessionId]);
    return result.rows[0];
  }

  async countActiveUsers(since) {
    const result = await this.pool.query(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM user_sessions
      WHERE session_start >= $1 AND session_end IS NULL
    `, [since]);
    return parseInt(result.rows[0].count, 10);
  }

  async countDAU(date) {
    const result = await this.pool.query(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM user_sessions
      WHERE DATE(session_start) = $1
    `, [date]);
    return parseInt(result.rows[0].count, 10);
  }

  async countWAU(date) {
    const result = await this.pool.query(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM user_sessions
      WHERE session_start >= $1::date - INTERVAL '6 days'
        AND session_start <= $1::date + INTERVAL '1 day'
    `, [date]);
    return parseInt(result.rows[0].count, 10);
  }

  async countMAU(date) {
    const result = await this.pool.query(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM user_sessions
      WHERE session_start >= $1::date - INTERVAL '29 days'
        AND session_start <= $1::date + INTERVAL '1 day'
    `, [date]);
    return parseInt(result.rows[0].count, 10);
  }
}

export default UserSessionRepository;
