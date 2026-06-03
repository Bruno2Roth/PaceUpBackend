import BaseRepository from './BaseRepository.js';

export class FollowerRepository extends BaseRepository {
  constructor() {
    super('followers');
  }

  async isFollowing(followerId, followingId) {
    const query = 'SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2';
    const result = await this.pool.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  }

  async getFollowers(userId, limit = 20, offset = 0) {
    const query = `
      SELECT u.* FROM users u
      INNER JOIN followers f ON u.id = f.follower_id
      WHERE f.following_id = $1 AND u.deleted_at IS NULL
      ORDER BY f.followed_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getFollowing(userId, limit = 20, offset = 0) {
    const query = `
      SELECT u.* FROM users u
      INNER JOIN followers f ON u.id = f.following_id
      WHERE f.follower_id = $1 AND u.deleted_at IS NULL
      ORDER BY f.followed_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getFollowerCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM followers WHERE following_id = $1';
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  async getFollowingCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM followers WHERE follower_id = $1';
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }
}

export default FollowerRepository;
