import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import config from '../../configs/environment.js';
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
        requesterId: req.userId, userId, activityType, onlyMine, limit, offset,
      });
      return res.status(200).json({ data: activities });
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

  async getFeed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const cursor = req.query.cursor || null;
      const type = req.query.type || 'global';

      let userId = null;
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          if (token) {
            const decoded = jwt.verify(token, config.jwt.secret);
            userId = decoded.userId;
          }
        } catch {
        }
      }

      if (type === 'following') {
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        const activities = await this.activityService.getFollowingActivitiesFeed(userId, cursor, limit);
        const nextCursor = activities.length === limit ? activities[activities.length - 1].start_time : null;
        return res.status(200).json({ data: activities, next_cursor: nextCursor });
      }

      const activities = await this.activityService.getGlobalFeed(cursor, limit);
      const nextCursor = activities.length === limit ? activities[activities.length - 1].start_time : null;
      return res.status(200).json({ data: activities, next_cursor: nextCursor });
    } catch (error) {
      next(error);
    }
  }

  async likeActivity(req, res, next) {
    try {
      const result = await this.activityService.likeActivity(req.params.id, req.userId);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unlikeActivity(req, res, next) {
    try {
      const result = await this.activityService.unlikeActivity(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getActivityLikes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const users = await this.activityService.getActivityLikes(req.params.id, limit, offset);
      return res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  async commentOnActivity(req, res, next) {
    try {
      const parentId = req.body.parent_id || null;
      const result = await this.activityService.commentOnActivity(req.params.id, req.userId, req.body.body, parentId);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getActivityComments(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const comments = await this.activityService.getActivityComments(req.params.id, limit, offset);
      return res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  }

  async getCommentReplies(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const replies = await this.activityService.getCommentReplies(req.params.id, limit, offset);
      return res.status(200).json({ replies });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const comment = await this.activityService.updateComment(req.params.commentId, req.userId, req.body.body);
      return res.status(200).json({ comment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      await this.activityService.deleteComment(req.params.commentId, req.userId);
      return res.status(200).json({ message: 'Comment deleted' });
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
