import UserSessionRepository from '../../data/repositories/UserSessionRepository.js';
import UserDailyActivityRepository from '../../data/repositories/UserDailyActivityRepository.js';
import { dbPool } from '../../configs/database.js';

export class AnalyticsService {
  constructor() {
    this.userSessionRepository = new UserSessionRepository();
    this.userDailyActivityRepository = new UserDailyActivityRepository();
    this.pool = dbPool.getPool();
  }

  async recordSession(userId, ip, userAgent) {
    return this.userSessionRepository.createSession(userId, ip, userAgent);
  }

  async endSession(sessionId) {
    return this.userSessionRepository.endSession(sessionId);
  }

  async recordDailyActivity(userId) {
    const today = new Date().toISOString().split('T')[0];

    const activityStats = await this.pool.query(`
      SELECT COUNT(*) AS activity_count, COALESCE(SUM(distance_m), 0) AS total_distance
      FROM activities
      WHERE user_id = $1 AND DATE(start_time) = $2 AND deleted_at IS NULL
    `, [userId, today]);

    const sessionStats = await this.pool.query(`
      SELECT COUNT(*) AS session_count
      FROM user_sessions
      WHERE user_id = $1 AND DATE(session_start) = $2
    `, [userId, today]);

    const activityCount = parseInt(activityStats.rows[0].activity_count, 10);
    const distanceKm = parseFloat(activityStats.rows[0].total_distance) / 1000;
    const sessionCount = parseInt(sessionStats.rows[0].session_count, 10);

    return this.userDailyActivityRepository.upsert(userId, today, {
      isActive: activityCount > 0 || sessionCount > 0,
      sessionCount,
      activityCount,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
    });
  }

  async getDAU(date) {
    return this.userSessionRepository.countDAU(date || new Date().toISOString().split('T')[0]);
  }

  async getWAU(date) {
    return this.userSessionRepository.countWAU(date || new Date().toISOString().split('T')[0]);
  }

  async getMAU(date) {
    return this.userSessionRepository.countMAU(date || new Date().toISOString().split('T')[0]);
  }

  async getCohortRetention(cohortDate, periods = 12) {
    const result = await this.pool.query(`
      WITH cohort_users AS (
        SELECT id
        FROM users
        WHERE DATE(created_at) = $1
      ),
      weekly_periods AS (
        SELECT generate_series(0, $2 - 1) AS period
      ),
      retention AS (
        SELECT
          wp.period,
          COUNT(DISTINCT cu.id) AS retained_users
        FROM cohort_users cu
        CROSS JOIN weekly_periods wp
        LEFT JOIN user_daily_activity uda
          ON cu.id = uda.user_id
          AND uda.date >= $1::date + (wp.period * 7)
          AND uda.date < $1::date + ((wp.period + 1) * 7)
          AND uda.is_active = TRUE
        GROUP BY wp.period
      )
      SELECT
        (SELECT COUNT(*) FROM cohort_users) AS cohort_size,
        period,
        retained_users,
        CASE WHEN (SELECT COUNT(*) FROM cohort_users) > 0
          THEN ROUND(100.0 * retained_users / (SELECT COUNT(*) FROM cohort_users), 2)
          ELSE 0
        END AS retention_pct
      FROM retention
      ORDER BY period
    `, [cohortDate, periods]);

    return result.rows;
  }

  async getEngagementScore(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const activityFreq = await this.pool.query(`
      SELECT COUNT(DISTINCT DATE(start_time)) AS active_days, COUNT(*) AS total_activities
      FROM activities
      WHERE user_id = $1 AND start_time >= $2 AND deleted_at IS NULL
    `, [userId, dateStr]);

    const sessionData = await this.pool.query(`
      SELECT COUNT(*) AS total_sessions
      FROM user_sessions
      WHERE user_id = $1 AND session_start >= $2
    `, [userId, dateStr]);

    const socialData = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM followers WHERE follower_id = $1) AS following_count,
        (SELECT COUNT(*) FROM followers WHERE following_id = $1) AS follower_count,
        (SELECT COUNT(*) FROM club_members WHERE user_id = $1) AS club_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = $1) AS comment_count,
        (SELECT COUNT(*) FROM likes WHERE user_id = $1) AS like_count
    `, [userId]);

    const activeDays = parseInt(activityFreq.rows[0].active_days, 10);
    const totalActivities = parseInt(activityFreq.rows[0].total_activities, 10);
    const totalSessions = parseInt(sessionData.rows[0].total_sessions, 10);
    const { following_count: followingCount, follower_count: followerCount, club_count: clubCount, comment_count: commentCount, like_count: likeCount } = socialData.rows[0];

    const activityScore = Math.min(40, (activeDays / 30) * 40);
    const sessionScore = Math.min(20, (totalSessions / 60) * 20);
    const activityVolScore = Math.min(15, (totalActivities / 30) * 15);
    const socialScore = Math.min(25,
      (parseInt(followingCount, 10) / 50) * 5 +
      (parseInt(followerCount, 10) / 50) * 5 +
      (parseInt(clubCount, 10) / 10) * 5 +
      (parseInt(commentCount, 10) / 20) * 5 +
      (parseInt(likeCount, 10) / 50) * 5,
    );

    const overall = Math.min(100, Math.round(activityScore + sessionScore + activityVolScore + socialScore));

    return {
      score: overall,
      breakdown: {
        activityFrequency: parseFloat(activityScore.toFixed(2)),
        sessionCount: parseFloat(sessionScore.toFixed(2)),
        activityVolume: parseFloat(activityVolScore.toFixed(2)),
        socialInteractions: parseFloat(socialScore.toFixed(2)),
      },
      metrics: {
        activeDays,
        totalActivities,
        totalSessions,
        followingCount: parseInt(followingCount, 10),
        followerCount: parseInt(followerCount, 10),
        clubCount: parseInt(clubCount, 10),
      },
    };
  }
}

export default AnalyticsService;
