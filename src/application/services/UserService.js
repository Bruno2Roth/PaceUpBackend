import UserRepository from '../../data/repositories/UserRepository.js';
import FollowerRepository from '../../data/repositories/FollowerRepository.js';
import AchievementRepository from '../../data/repositories/AchievementRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../configs/cloudinary.js';

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.followerRepository = new FollowerRepository();
    this.achievementRepository = new AchievementRepository();
    this.activityRepository = new ActivityRepository();
  }

  async getUserProfile(userId) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      followerCount, followingCount, lifetimeStats,
      weeklyStats, monthlyStats, yearlyStats,
      recentActivities, topDistances, personalBests,
      streakDates,
    ] = await Promise.all([
      this.followerRepository.getFollowerCount(userId),
      this.followerRepository.getFollowingCount(userId),
      this.activityRepository.getActivityStats(userId),
      this.activityRepository.getActivityStatsByPeriod(userId, startOfWeek.toISOString()),
      this.activityRepository.getActivityStatsByPeriod(userId, startOfMonth.toISOString()),
      this.activityRepository.getActivityStatsByPeriod(userId, startOfYear.toISOString()),
      this.activityRepository.getRecentActivities(userId, 5),
      this.activityRepository.getTopDistances(userId, 5),
      this.activityRepository.getPersonalBests(userId),
      this.activityRepository.getStreakData(userId),
    ]);

    const { currentStreak, maxStreak } = this.calculateStreaks(streakDates);

    delete user.password;

    return {
      ...user,
      current_streak: currentStreak,
      max_streak: maxStreak || user.max_streak,
      follower_count: followerCount,
      following_count: followingCount,
      stats: lifetimeStats,
      stats_week: weeklyStats,
      stats_month: monthlyStats,
      stats_year: yearlyStats,
      recent_activities: recentActivities,
      top_distances: topDistances,
      personal_bests: personalBests,
    };
  }

  calculateStreaks(dates) {
    if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let maxStreak = 1;
    let tempStreak = 1;

    const sorted = dates.map((d) => new Date(d)).sort((a, b) => b - a);
    const mostRecent = sorted[0];
    const diffFromToday = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));

    if (diffFromToday > 1) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
    }

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.floor((sorted[i - 1] - sorted[i]) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
        if (diffFromToday <= 1 && i === 1) currentStreak = tempStreak;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    if (diffFromToday <= 1) currentStreak = Math.max(currentStreak, 1);
    return { currentStreak, maxStreak };
  }

  async updateProfile(userId, profileData) {
    const allowedFields = ['name', 'username', 'bio', 'city', 'country', 'gender', 'date_of_birth'];
    const payload = {};

    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        payload[field] = profileData[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      const err = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    if (payload.username) {
      const existing = await this.userRepository.findOne('username = $1 AND id != $2', [payload.username, userId]);
      if (existing) {
        const err = new Error('Username already taken');
        err.status = 409;
        throw err;
      }
    }

    const user = await this.userRepository.update(userId, payload);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    delete user.password;
    return user;
  }

  async uploadProfilePicture(userId, file) {
    if (!file) {
      const err = new Error('No file provided');
      err.status = 400;
      throw err;
    }

    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const oldPublicId = user.profile_picture_url
      ? this.extractPublicIdFromUrl(user.profile_picture_url)
      : null;

    const result = await uploadToCloudinary(file, 'profiles');
    const updatedUser = await this.userRepository.update(userId, {
      profile_picture_url: result.url,
    });

    if (oldPublicId) {
      try { await deleteFromCloudinary(oldPublicId); } catch { }
    }

    delete updatedUser.password;
    return updatedUser;
  }

  extractPublicIdFromUrl(url) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }

  async getUserStats(userId) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return this.activityRepository.getActivityStats(userId);
  }

  async getUserById(userId, requesterId = null) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const [followerCount, followingCount, recentActivities, topDistances, personalBests, stats, streakDates] = await Promise.all([
      this.followerRepository.getFollowerCount(userId),
      this.followerRepository.getFollowingCount(userId),
      this.activityRepository.getRecentActivities(userId, 5),
      this.activityRepository.getTopDistances(userId, 5),
      this.activityRepository.getPersonalBests(userId),
      this.activityRepository.getActivityStats(userId),
      this.activityRepository.getStreakData(userId),
    ]);

    const { currentStreak, maxStreak } = this.calculateStreaks(streakDates);

    let isFollowing = false;
    if (requesterId && requesterId !== userId) {
      isFollowing = await this.followerRepository.isFollowing(requesterId, userId);
    }

    delete user.password;
    delete user.email;

    return {
      ...user,
      current_streak: currentStreak,
      max_streak: maxStreak || user.max_streak,
      follower_count: followerCount,
      following_count: followingCount,
      stats,
      recent_activities: recentActivities,
      top_distances: topDistances,
      personal_bests: personalBests,
      is_following: isFollowing,
    };
  }

  async getUserActivities(userId, limit = 20, offset = 0) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return this.activityRepository.findByUserId(userId, limit, offset);
  }

  async searchUsers(query, limit = 20, offset = 0) {
    if (!query || query.trim().length === 0) {
      const err = new Error('Search query is required');
      err.status = 400;
      throw err;
    }
    return this.userRepository.searchUsers(query.trim(), limit, offset);
  }

  async followUser(followerId, followingId) {
    if (followerId === followingId) {
      const err = new Error('Cannot follow yourself');
      err.status = 400;
      throw err;
    }

    const targetUser = await this.userRepository.findNonDeletedById(followingId);
    if (!targetUser) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const alreadyFollowing = await this.followerRepository.isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      const err = new Error('Already following this user');
      err.status = 409;
      throw err;
    }

    const follow = await this.followerRepository.create({
      follower_id: followerId,
      following_id: followingId,
    });

    return { follow, targetUser };
  }

  async unfollowUser(followerId, followingId) {
    if (followerId === followingId) {
      const err = new Error('Cannot unfollow yourself');
      err.status = 400;
      throw err;
    }

    const existing = await this.followerRepository.isFollowing(followerId, followingId);
    if (!existing) {
      const err = new Error('Not following this user');
      err.status = 404;
      throw err;
    }

    return this.followerRepository.deleteFollow(followerId, followingId);
  }

  async getFollowers(userId, limit = 20, offset = 0) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const followers = await this.followerRepository.getFollowers(userId, limit, offset);
    return followers.map((u) => {
      delete u.password;
      delete u.email;
      return u;
    });
  }

  async getFollowing(userId, limit = 20, offset = 0) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const following = await this.followerRepository.getFollowing(userId, limit, offset);
    return following.map((u) => {
      delete u.password;
      delete u.email;
      return u;
    });
  }
}

export default UserService;
