import RecommendationService from '../../application/services/RecommendationService.js';

export class RecommendationController {
  constructor() {
    this.recommendationService = new RecommendationService();
  }

  async getClubs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const clubs = await this.recommendationService.recommendClubs(req.userId, limit);
      return res.status(200).json({ data: clubs });
    } catch (error) {
      next(error);
    }
  }

  async getChallenges(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const challenges = await this.recommendationService.recommendChallenges(req.userId, limit);
      return res.status(200).json({ data: challenges });
    } catch (error) {
      next(error);
    }
  }

  async getRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const routes = await this.recommendationService.recommendRoutes(req.userId, limit);
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const events = await this.recommendationService.recommendEvents(req.userId, limit);
      return res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }
}

export default RecommendationController;
