import UserBadgeRepository from '../../data/repositories/UserBadgeRepository.js';
import SpecialBadgeRepository from '../../data/repositories/SpecialBadgeRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import ClubRepository from '../../data/repositories/ClubRepository.js';

export class BadgeService {
  constructor() {
    this.userBadgeRepository = new UserBadgeRepository();
    this.specialBadgeRepository = new SpecialBadgeRepository();
    this.activityRepository = new ActivityRepository();
    this.userRepository = new UserRepository();
    this.clubRepository = new ClubRepository();
  }

  async getUserBadges(userId) {
    return this.userBadgeRepository.findByUser(userId);
  }

  async checkAndAward(userId, context = {}) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const checks = {
      verified_runner: async () => {
        const result = await this.userRepository.pool.query(
          `SELECT 1 FROM integration_connections WHERE user_id = $1 AND provider = 'strava' AND is_connected = true LIMIT 1`,
          [userId],
        );
        return result.rows.length > 0;
      },

      marathon_finisher: async () => {
        const result = await this.userRepository.pool.query(
          'SELECT 1 FROM activities WHERE user_id = $1 AND distance_m >= 42195 AND deleted_at IS NULL LIMIT 1',
          [userId],
        );
        return result.rows.length > 0;
      },

      ultra_runner: async () => {
        const result = await this.userRepository.pool.query(
          'SELECT 1 FROM activities WHERE user_id = $1 AND distance_m >= 50000 AND deleted_at IS NULL LIMIT 1',
          [userId],
        );
        return result.rows.length > 0;
      },

      club_leader: async () => {
        const result = await this.userRepository.pool.query(
          `SELECT 1 FROM club_members WHERE user_id = $1 AND role = 'admin' LIMIT 1`,
          [userId],
        );
        return result.rows.length > 0;
      },

      early_adopter: async () => {
        return user.created_at && new Date(user.created_at) < new Date('2024-06-01');
      },

      centurion: async () => {
        const result = await this.userRepository.pool.query(
          'SELECT COUNT(*)::int as count FROM activities WHERE user_id = $1 AND deleted_at IS NULL',
          [userId],
        );
        return result.rows[0].count >= 100;
      },

      streak_master: async () => {
        return (user.current_streak || 0) >= 30;
      },

      global_explorer: async () => {
        const result = await this.userRepository.pool.query(
          `SELECT COUNT(DISTINCT country)::int as count FROM activities WHERE user_id = $1 AND country IS NOT NULL AND country != '' AND deleted_at IS NULL`,
          [userId],
        );
        return result.rows[0].count >= 10;
      },
    };

    const awarded = [];
    for (const [code, checkFn] of Object.entries(checks)) {
      const alreadyHas = await this.userBadgeRepository.hasBadge(userId, code);
      if (alreadyHas) continue;
      const conditionMet = await checkFn();
      if (!conditionMet) continue;
      const badge = await this.userBadgeRepository.awardBadge(userId, code);
      if (badge) awarded.push(badge);
    }
    return awarded;
  }
}

export default BadgeService;
