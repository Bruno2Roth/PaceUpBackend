import { validationResult } from 'express-validator';
import ActivityService from '../../application/services/ActivityService.js';

export class ActivityController {
  constructor() {
    this.activityService = new ActivityService();
  }

  async createActivity(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const activity = await this.activityService.createActivity(req.userId, req.body);
      return res.status(201).json({ activity });
    } catch (error) {
      next(error);
    }
  }

  async importActivities(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const activities = await this.activityService.importActivities(req.userId, req.body.activities);
      return res.status(201).json({ imported: activities.length, activities });
    } catch (error) {
      next(error);
    }
  }

  async getActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const activityType = req.query.activity_type || null;
      const userId = req.query.user_id || null;
      const onlyMine = req.query.mine === 'true' || req.query.mine === '1';

      const activities = await this.activityService.getActivities({
        requesterId: req.userId,
        userId,
        activityType,
        onlyMine,
        limit,
        offset,
      });

      return res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req, res, next) {
    try {
      const activity = await this.activityService.getActivity(req.params.id, req.userId);
      return res.status(200).json({ activity });
    } catch (error) {
      next(error);
    }
  }

  async updateActivity(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const activity = await this.activityService.updateActivity(req.params.id, req.userId, req.body);
      return res.status(200).json({ activity });
    } catch (error) {
      next(error);
    }
  }

  async deleteActivity(req, res, next) {
    try {
      const activity = await this.activityService.deleteActivity(req.params.id, req.userId);
      return res.status(200).json({ activity });
    } catch (error) {
      next(error);
    }
  }

  async getFollowingActivitiesFeed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const activities = await this.activityService.getFollowingActivitiesFeed(req.userId, limit, offset);
      return res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  }

  async likeActivity(req, res, next) {
    try {
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async unlikeActivity(req, res, next) {
    try {
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async commentOnActivity(req, res, next) {
    try {
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getActivityComments(req, res, next) {
    try {
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getActivityStats(req, res, next) {
    try {
      const stats = await this.activityService.getActivityStats(req.userId);
      return res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }
}

export default ActivityController;
