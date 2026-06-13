import PublicApiService from '../../application/services/PublicApiService.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';

export class PublicApiController {
  constructor() {
    this.publicApiService = new PublicApiService();
    this.activityRepository = new ActivityRepository();
  }

  async registerApp(req, res, next) {
    try {
      const app = await this.publicApiService.registerApp(req.body, req.userId);
      return res.status(201).json({ data: app });
    } catch (error) {
      next(error);
    }
  }

  async getActivities(req, res, next) {
    try {
      if (!req.scopes.includes('activities')) {
        return res.status(403).json({ error: 'Missing required scope: activities' });
      }

      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const activities = await this.activityRepository.findByUserId(req.userId, limit, offset);
      return res.status(200).json({ data: activities });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      if (!req.scopes.includes('profile')) {
        return res.status(403).json({ error: 'Missing required scope: profile' });
      }

      const result = await this.activityRepository.pool.query(`
        SELECT id, name, username, bio, profile_picture_url, city, country
        FROM users
        WHERE id = $1
      `, [req.userId]);
      return res.status(200).json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
}

export default PublicApiController;
