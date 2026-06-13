import crypto from 'crypto';
import SharedActivityRepository from '../../data/repositories/SharedActivityRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import config from '../../configs/environment.js';

export class ShareService {
  constructor() {
    this.sharedActivityRepository = new SharedActivityRepository();
    this.activityRepository = new ActivityRepository();
  }

  async createShareLink(activityId, userId) {
    const shareToken = crypto.randomBytes(16).toString('hex');
    const shared = await this.sharedActivityRepository.create({
      activity_id: activityId,
      user_id: userId,
      share_token: shareToken,
      is_public: true,
      view_count: 0,
    });
    return {
      ...shared,
      share_url: `${config.app.url}/share/activity/${shareToken}`,
    };
  }

  async getSharedActivity(token) {
    const shared = await this.sharedActivityRepository.findByToken(token);
    if (!shared) {
      const err = new Error('Shared activity not found');
      err.status = 404;
      throw err;
    }
    await this.sharedActivityRepository.incrementViewCount(shared.id);
    return shared;
  }

  async generateActivityImage(activityId) {
    const activity = await this.activityRepository.findNonDeletedById(activityId);
    if (!activity) {
      const err = new Error('Activity not found');
      err.status = 404;
      throw err;
    }
    return {
      distance: activity.distance_m,
      pace: activity.pace_per_km,
      elevation: activity.elevation_gain_m,
      duration: activity.duration_seconds,
      activity_type: activity.activityType,
      title: activity.title,
      start_time: activity.start_time,
    };
  }
}

export default ShareService;
