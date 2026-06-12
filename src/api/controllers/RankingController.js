import RankingService from '../../application/services/RankingService.js';

export class RankingController {
  constructor() {
    this.rankingService = new RankingService();
  }

  async getGlobalRankings(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const activityType = req.query.activity_type || null;
      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = parseInt(req.query.offset, 10) || 0;
      const rankings = await this.rankingService.getGlobalRankings(criteria, activityType, limit, offset);
      return res.status(200).json({ rankings });
    } catch (error) {
      next(error);
    }
  }

  async getUserRank(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const rank = await this.rankingService.getUserRank(req.userId, criteria);
      return res.status(200).json({ rank });
    } catch (error) {
      next(error);
    }
  }

  async getClubRankings(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const limit = parseInt(req.query.limit, 10) || 100;
      const rankings = await this.rankingService.getClubRankings(req.params.clubId, criteria, limit);
      return res.status(200).json({ rankings });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRankings(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const limit = parseInt(req.query.limit, 10) || 100;
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
      const rankings = await this.rankingService.getMonthlyRankings(year, month, criteria, limit);
      return res.status(200).json({ rankings });
    } catch (error) {
      next(error);
    }
  }

  async getYearlyRankings(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const limit = parseInt(req.query.limit, 10) || 100;
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const rankings = await this.rankingService.getYearlyRankings(year, criteria, limit);
      return res.status(200).json({ rankings });
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const criteria = req.query.criteria || 'distance';
      const period = req.query.period || 'all';
      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = parseInt(req.query.offset, 10) || 0;
      const rankings = await this.rankingService.getLeaderboard(criteria, period, limit, offset);
      return res.status(200).json({ rankings });
    } catch (error) {
      next(error);
    }
  }
}

export default RankingController;
