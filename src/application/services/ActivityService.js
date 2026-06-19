import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import CommentRepository from '../../data/repositories/CommentRepository.js';
import LikeRepository from '../../data/repositories/LikeRepository.js';
import GPSService from './GPSService.js';
import NotificationService from './NotificationService.js';
import XpService from './XpService.js';
import AchievementService from './AchievementService.js';
import ChallengeService from './ChallengeService.js';
import redis from '../../configs/redis.js';
import { emitFeedUpdate } from '../../sockets/emitter.js';

const FEED_CACHE_PREFIX = 'feed:';
const FEED_CACHE_TTL = 60;

export class ActivityService {
  constructor() {
    this.activityRepository = new ActivityRepository();
    this.commentRepository = new CommentRepository();
    this.likeRepository = new LikeRepository();
    this.gpsService = new GPSService();
    this.notificationService = new NotificationService();
    this.xpService = new XpService();
    this.achievementService = new AchievementService();
    this.challengeService = new ChallengeService();
  }

  async createActivity(userId, activityData) {
    const payload = this.buildActivityPayload(userId, activityData);
    const activity = await this.activityRepository.create(payload);

    await this.xpService.awardXp(userId, 'activity_completed', { activityId: activity.id });

    if (userId) {
      const totalActivities = await this.activityRepository.count('user_id = $1 AND deleted_at IS NULL', [userId]);
      if (totalActivities === 1) {
        await this.xpService.awardXp(userId, 'first_activity', { activityId: activity.id });
      }
    }

    const achievements = await this.achievementService.evaluateAndAward(userId, activity);

    if (activity.club_id) {
      const activeChallenges = await this.challengeService.getChallengesByClub(activity.club_id);
      for (const challenge of activeChallenges) {
        await this.challengeService.updateParticipantProgress(challenge.id, userId, activity);
      }
    }

    await redis.delete(`${FEED_CACHE_PREFIX}${userId}:page1`);
    await redis.delete(`${FEED_CACHE_PREFIX}global:page1`);

    return { activity, achievements };
  }

  async importActivities(userId, activities) {
    if (!Array.isArray(activities) || activities.length === 0) {
      const err = new Error('activities must be a non-empty array');
      err.status = 400;
      throw err;
    }

    const created = [];
    for (const activityData of activities) {
      const payload = this.buildActivityPayload(userId, activityData);
      const activity = await this.activityRepository.create(payload);
      created.push(activity);
    }

    if (created.length > 0) {
      await this.xpService.awardXp(userId, 'activity_completed', { activityId: created[0].id });
    }

    await redis.delete(`${FEED_CACHE_PREFIX}${userId}:page1`);
    await redis.delete(`${FEED_CACHE_PREFIX}global:page1`);

    return created;
  }

  buildActivityPayload(userId, activityData) {
    const payload = {
      user_id: userId,
      title: activityData.title || null,
      description: activityData.description || null,
      activity_type: activityData.activity_type || 'running',
      distance_m: Number(activityData.distance_m) || 0,
      duration_seconds: Number(activityData.duration_seconds) || 0,
      start_time: activityData.start_time,
      end_time: activityData.end_time,
      route_id: activityData.route_id || null,
      club_id: activityData.club_id || null,
      gps_data: activityData.gps_data || null,
      weather_data: activityData.weather_data || null,
      is_private: activityData.is_private === true,
      is_race: activityData.is_race === true,
      is_workout: activityData.is_workout === true,
      average_heartrate: activityData.average_heartrate ? Number(activityData.average_heartrate) : null,
      max_heartrate: activityData.max_heartrate ? Number(activityData.max_heartrate) : null,
    };

    if (Array.isArray(activityData.gps_data) && this.gpsService.validateGPSData(activityData.gps_data)) {
      if (!payload.distance_m) {
        payload.distance_m = this.gpsService.calculateDistance(activityData.gps_data);
      }
      if (!payload.duration_seconds && activityData.gps_data.length > 1) {
        const firstTimestamp = new Date(activityData.gps_data[0].timestamp).getTime();
        const lastTimestamp = new Date(activityData.gps_data[activityData.gps_data.length - 1].timestamp).getTime();
        payload.duration_seconds = Math.round(Math.max(lastTimestamp - firstTimestamp, 0) / 1000);
      }
      const elevation = this.gpsService.calculateElevation(activityData.gps_data);
      payload.elevation_gain_m = elevation.elevation_gain_m;
      payload.elevation_loss_m = elevation.elevation_loss_m;
    }

    if (payload.distance_m > 0 && payload.duration_seconds > 0) {
      payload.pace_per_km = this.gpsService.calculatePace(payload.distance_m, payload.duration_seconds);
      payload.average_speed_kmh = Number(((payload.distance_m / 1000) / (payload.duration_seconds / 3600)).toFixed(2));
    } else {
      payload.pace_per_km = null;
      payload.average_speed_kmh = null;
    }

    payload.max_speed_kmh = activityData.max_speed_kmh ? Number(activityData.max_speed_kmh) : null;
    payload.elevation_gain_m = payload.elevation_gain_m || (activityData.elevation_gain_m ? Number(activityData.elevation_gain_m) : null);
    payload.elevation_loss_m = payload.elevation_loss_m || (activityData.elevation_loss_m ? Number(activityData.elevation_loss_m) : null);
    payload.calories_burned = activityData.calories_burned ? Number(activityData.calories_burned) : this.calculateCalories(payload.distance_m);

    return payload;
  }

  calculateCalories(distanceMeters) {
    if (!distanceMeters || distanceMeters <= 0) return null;
    return Math.round((distanceMeters / 1000) * 60);
  }

  async getActivity(activityId, requesterId = null) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    if (activity.is_private && requesterId !== activity.user_id) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    const [commentCount, likeCount] = await Promise.all([
      this.commentRepository.countByActivityId(activityId).catch(() => 0),
      this.likeRepository.countByActivityId(activityId).catch(() => 0),
    ]);

    return { ...activity, comment_count: commentCount, like_count: likeCount };
  }

  async getActivities({ requesterId = null, userId = null, activityType = null, onlyMine = false, limit = 20, offset = 0 }) {
    if (onlyMine && requesterId) {
      return this.activityRepository.findByUserId(requesterId, limit, offset);
    }

    const clauses = ['deleted_at IS NULL', 'is_private = false'];
    const params = [];

    if (userId) {
      params.push(userId);
      clauses.push(`user_id = $${params.length}`);
    }
    if (activityType) {
      params.push(activityType);
      clauses.push(`activity_type = $${params.length}`);
    }

    return this.activityRepository.findMany(clauses.join(' AND '), params, limit, offset);
  }

  async updateActivity(activityId, userId, updateData) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }
    if (activity.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const payload = {
      title: updateData.title ?? activity.title,
      description: updateData.description ?? activity.description,
      activity_type: updateData.activity_type ?? activity.activity_type,
      distance_m: updateData.distance_m !== undefined ? Number(updateData.distance_m) : activity.distance_m,
      duration_seconds: updateData.duration_seconds !== undefined ? Number(updateData.duration_seconds) : activity.duration_seconds,
      start_time: updateData.start_time ?? activity.start_time,
      end_time: updateData.end_time ?? activity.end_time,
      route_id: updateData.route_id ?? activity.route_id,
      club_id: updateData.club_id ?? activity.club_id,
      gps_data: updateData.gps_data ?? activity.gps_data,
      weather_data: updateData.weather_data ?? activity.weather_data,
      is_private: updateData.is_private !== undefined ? Boolean(updateData.is_private) : activity.is_private,
      is_race: updateData.is_race !== undefined ? Boolean(updateData.is_race) : activity.is_race,
      is_workout: updateData.is_workout !== undefined ? Boolean(updateData.is_workout) : activity.is_workout,
      average_heartrate: updateData.average_heartrate !== undefined ? Number(updateData.average_heartrate) : activity.average_heartrate,
      max_heartrate: updateData.max_heartrate !== undefined ? Number(updateData.max_heartrate) : activity.max_heartrate,
      max_speed_kmh: updateData.max_speed_kmh !== undefined ? Number(updateData.max_speed_kmh) : activity.max_speed_kmh,
      elevation_gain_m: updateData.elevation_gain_m !== undefined ? Number(updateData.elevation_gain_m) : activity.elevation_gain_m,
      elevation_loss_m: updateData.elevation_loss_m !== undefined ? Number(updateData.elevation_loss_m) : activity.elevation_loss_m,
      calories_burned: updateData.calories_burned !== undefined ? Number(updateData.calories_burned) : activity.calories_burned,
    };

    return this.activityRepository.update(activityId, this.buildActivityPayload(userId, payload));
  }

  async deleteActivity(activityId, userId) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }
    if (activity.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    return this.activityRepository.softDelete(activityId);
  }

  async getGlobalFeed(cursor = null, limit = 20) {
    const cacheKey = cursor ? null : `${FEED_CACHE_PREFIX}global:page1`;
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    }

    const activities = await this.activityRepository.getGlobalFeedWithCounts(cursor, limit);

    if (cacheKey && activities.length > 0) {
      await redis.set(cacheKey, activities, FEED_CACHE_TTL);
    }

    return activities;
  }

  async getFollowingActivitiesFeed(userId, cursor = null, limit = 20) {
    if (!userId) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }

    const cacheKey = cursor ? null : `${FEED_CACHE_PREFIX}${userId}:page1`;
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    }

    const activities = await this.activityRepository.getFeedWithCounts(userId, cursor, limit);

    if (cacheKey && activities.length > 0) {
      await redis.set(cacheKey, activities, FEED_CACHE_TTL);
    }

    return activities;
  }

  async getActivityStats(userId) {
    if (!userId) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }
    return this.activityRepository.getActivityStats(userId);
  }

  async likeActivity(activityId, userId) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    const alreadyLiked = await this.likeRepository.isLiked(activityId, userId);
    if (alreadyLiked) {
      const err = new Error('Already liked this activity');
      err.status = 409;
      throw err;
    }

    const like = await this.likeRepository.create({ activity_id: activityId, user_id: userId });
    const likeCount = await this.likeRepository.countByActivityId(activityId);

    await this.notificationService.notifyLike(activity.user_id, activityId, userId);

    await redis.delete(`${FEED_CACHE_PREFIX}${userId}:page1`);
    await redis.delete(`${FEED_CACHE_PREFIX}global:page1`);

    return { like, like_count: likeCount };
  }

  async unlikeActivity(activityId, userId) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    const alreadyLiked = await this.likeRepository.isLiked(activityId, userId);
    if (!alreadyLiked) {
      const err = new Error('Not liked yet');
      err.status = 404;
      throw err;
    }

    await this.likeRepository.deleteLike(activityId, userId);
    const likeCount = await this.likeRepository.countByActivityId(activityId);

    await redis.delete(`${FEED_CACHE_PREFIX}${userId}:page1`);
    await redis.delete(`${FEED_CACHE_PREFIX}global:page1`);

    return { like_count: likeCount };
  }

  async getActivityLikes(activityId, limit = 20, offset = 0) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }
    return this.likeRepository.findByActivityId(activityId, limit, offset);
  }

  async commentOnActivity(activityId, userId, body, parentId = null) {
    if (!body || body.trim().length === 0) {
      const err = new Error('Comment body is required');
      err.status = 400;
      throw err;
    }

    const sanitized = body.trim().substring(0, 2000);

    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }

    if (parentId) {
      const parentComment = await this.commentRepository.findNonDeletedById(parentId);
      if (!parentComment || parentComment.activity_id !== Number(activityId)) {
        const err = new Error('Parent comment not found');
        err.status = 404;
        throw err;
      }
    }

    const comment = await this.commentRepository.create({
      activity_id: activityId,
      user_id: userId,
      body: sanitized,
      parent_id: parentId || null,
    });

    if (parentId) {
      await this.commentRepository.incrementReplyCount(parentId);
    }

    const commentCount = await this.commentRepository.countByActivityId(activityId);

    await this.notificationService.notifyComment(activity.user_id, activityId, userId, comment.id);

    await redis.delete(`${FEED_CACHE_PREFIX}${userId}:page1`);
    await redis.delete(`${FEED_CACHE_PREFIX}global:page1`);

    return { comment, comment_count: commentCount };
  }

  async getActivityComments(activityId, limit = 20, offset = 0) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }
    return this.commentRepository.findByActivityId(activityId, limit, offset);
  }

  async getCommentReplies(commentId, limit = 20, offset = 0) {
    const comment = await this.commentRepository.findNonDeletedById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    return this.commentRepository.findReplies(commentId, limit, offset);
  }

  async updateComment(commentId, userId, body) {
    const comment = await this.commentRepository.findNonDeletedById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    if (comment.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    if (!body || body.trim().length === 0) {
      const err = new Error('Comment body is required');
      err.status = 400;
      throw err;
    }
    const sanitized = body.trim().substring(0, 2000).replace(/<[^>]*>/g, '');
    return this.commentRepository.updateComment(commentId, sanitized);
  }

  async deleteComment(commentId, userId) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    if (comment.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    return this.commentRepository.softDelete(commentId);
  }
}

export default ActivityService;
