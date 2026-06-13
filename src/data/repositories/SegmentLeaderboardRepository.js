import BaseRepository from './BaseRepository.js';

export class SegmentLeaderboardRepository extends BaseRepository {
  constructor() {
    super('segment_leaderboards');
  }

  async findBySegment(segmentId, limit = 50) {
    const query = `
      SELECT sl.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM segment_leaderboards sl
      INNER JOIN users u ON sl.user_id = u.id
      WHERE sl.segment_id = $1
      ORDER BY sl.rank ASC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [segmentId, limit]);
    return result.rows;
  }

  async findBySegmentAndUser(segmentId, userId) {
    const query = `
      SELECT * FROM segment_leaderboards
      WHERE segment_id = $1 AND user_id = $2
    `;
    const result = await this.pool.query(query, [segmentId, userId]);
    return result.rows[0] || null;
  }

  async getKOM(segmentId) {
    const query = `
      SELECT sl.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM segment_leaderboards sl
      INNER JOIN users u ON sl.user_id = u.id
      WHERE sl.segment_id = $1 AND sl.is_kom = TRUE
      LIMIT 1
    `;
    const result = await this.pool.query(query, [segmentId]);
    return result.rows[0] || null;
  }

  async getQOM(segmentId) {
    const query = `
      SELECT sl.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM segment_leaderboards sl
      INNER JOIN users u ON sl.user_id = u.id
      WHERE sl.segment_id = $1 AND sl.is_qom = TRUE
      LIMIT 1
    `;
    const result = await this.pool.query(query, [segmentId]);
    return result.rows[0] || null;
  }

  async getCourseRecord(segmentId) {
    const query = `
      SELECT sl.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM segment_leaderboards sl
      INNER JOIN users u ON sl.user_id = u.id
      WHERE sl.segment_id = $1 AND sl.is_course_record = TRUE
      LIMIT 1
    `;
    const result = await this.pool.query(query, [segmentId]);
    return result.rows[0] || null;
  }

  async updateRankings(segmentId) {
    const query = `
      UPDATE segment_leaderboards
      SET rank = sub.new_rank, updated_at = CURRENT_TIMESTAMP
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY elapsed_seconds ASC) AS new_rank
        FROM segment_leaderboards
        WHERE segment_id = $1
      ) sub
      WHERE segment_leaderboards.id = sub.id
    `;
    await this.pool.query(query, [segmentId]);
  }

  async clearKOM(segmentId) {
    const query = `
      UPDATE segment_leaderboards
      SET is_kom = FALSE, is_qom = FALSE, is_course_record = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE segment_id = $1
    `;
    await this.pool.query(query, [segmentId]);
  }
}

export default SegmentLeaderboardRepository;
