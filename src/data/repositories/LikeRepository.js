import BaseRepository from './BaseRepository.js';
import redis from '../../configs/redis.js';

const LIKE_COUNT_CACHE_PREFIX = 'like_count:';
const LIKE_COUNT_TTL = 300;

export class LikeRepository extends BaseRepository {
  constructor() {
    super('likes');
  }

  async isLiked(activityId, userId) {
    const query = 'SELECT * FROM likes WHERE activity_id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [activityId, userId]);
    return result.rows.length > 0;
  }

  async countByActivityId(activityId) {
    const cacheKey = `${LIKE_COUNT_CACHE_PREFIX}${activityId}`;
    const cached = await redis.get(cacheKey);
    if (cached !== null) return cached;

    const query = 'SELECT COUNT(*) as count FROM likes WHERE activity_id = $1';
    const result = await this.pool.query(query, [activityId]);
    const count = parseInt(result.rows[0].count, 10);
    await redis.set(cacheKey, count, LIKE_COUNT_TTL);
    return count;
  }

  async findByActivityId(activityId, limit = 20, offset = 0) {
    const query = `
      SELECT u.id, u.name, u.profile_picture_url, l.liked_at
      FROM users u
      INNER JOIN likes l ON u.id = l.user_id
      WHERE l.activity_id = $1
      ORDER BY l.liked_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [activityId, limit, offset]);
    return result.rows;
  }

  async deleteLike(activityId, userId) {
    const query = 'DELETE FROM likes WHERE activity_id = $1 AND user_id = $2 RETURNING *';
    const result = await this.pool.query(query, [activityId, userId]);
    const cacheKey = `${LIKE_COUNT_CACHE_PREFIX}${activityId}`;
    await redis.delete(cacheKey);
    return result.rows[0];
  }

  async countByActivityIdBulk(activityIds) {
    if (activityIds.length === 0) return {};
    const placeholders = activityIds.map((_, i) => `$${i + 1}`).join(', ');
    const query = `SELECT activity_id, COUNT(*)::int as count FROM likes WHERE activity_id IN (${placeholders}) GROUP BY activity_id`;
    const result = await this.pool.query(query, activityIds);
    const map = {};
    for (const row of result.rows) {
      map[row.activity_id] = row.count;
    }
    return map;
  }
}

export default LikeRepository;
