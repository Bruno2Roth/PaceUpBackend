import BaseRepository from './BaseRepository.js';

export class SegmentEffortRepository extends BaseRepository {
  constructor() {
    super('segment_efforts');
  }

  async findBySegment(segmentId, limit = 20, offset = 0) {
    const query = `
      SELECT se.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM segment_efforts se
      INNER JOIN users u ON se.user_id = u.id
      WHERE se.segment_id = $1
      ORDER BY se.elapsed_seconds ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [segmentId, limit, offset]);
    return result.rows;
  }

  async findByUserAndSegment(userId, segmentId) {
    const query = `
      SELECT * FROM segment_efforts
      WHERE user_id = $1 AND segment_id = $2
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId, segmentId]);
    return result.rows;
  }

  async findByActivity(activityId) {
    const query = `
      SELECT * FROM segment_efforts
      WHERE activity_id = $1
      ORDER BY elapsed_seconds ASC
    `;
    const result = await this.pool.query(query, [activityId]);
    return result.rows;
  }

  async getBestEffort(segmentId) {
    const query = `
      SELECT * FROM segment_efforts
      WHERE segment_id = $1
      ORDER BY elapsed_seconds ASC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [segmentId]);
    return result.rows[0] || null;
  }

  async getLeaderboard(segmentId, limit = 50, offset = 0) {
    const query = `
      SELECT se.*, u.name AS user_name, u.username, u.profile_picture_url,
        ROW_NUMBER() OVER (ORDER BY se.elapsed_seconds ASC) AS position
      FROM segment_efforts se
      INNER JOIN users u ON se.user_id = u.id
      WHERE se.segment_id = $1
      ORDER BY se.elapsed_seconds ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [segmentId, limit, offset]);
    return result.rows;
  }
}

export default SegmentEffortRepository;
