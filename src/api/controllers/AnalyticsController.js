import AnalyticsService from '../../application/services/AnalyticsService.js';

export class AnalyticsController {
  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  async getDAU(req, res, next) {
    try {
      const date = req.query.date || null;
      const count = await this.analyticsService.getDAU(date);
      return res.status(200).json({ data: { date: date || new Date().toISOString().split('T')[0], count } });
    } catch (error) {
      next(error);
    }
  }

  async getWAU(req, res, next) {
    try {
      const date = req.query.date || null;
      const count = await this.analyticsService.getWAU(date);
      return res.status(200).json({ data: { date: date || new Date().toISOString().split('T')[0], count } });
    } catch (error) {
      next(error);
    }
  }

  async getMAU(req, res, next) {
    try {
      const date = req.query.date || null;
      const count = await this.analyticsService.getMAU(date);
      return res.status(200).json({ data: { date: date || new Date().toISOString().split('T')[0], count } });
    } catch (error) {
      next(error);
    }
  }

  async getCohortRetention(req, res, next) {
    try {
      const cohortDate = req.query.cohortDate;
      const periods = parseInt(req.query.periods, 10) || 12;

      if (!cohortDate) {
        return res.status(400).json({ error: 'cohortDate query parameter is required' });
      }

      const retention = await this.analyticsService.getCohortRetention(cohortDate, periods);
      return res.status(200).json({ data: retention });
    } catch (error) {
      next(error);
    }
  }

  async getEngagementScore(req, res, next) {
    try {
      const score = await this.analyticsService.getEngagementScore(req.userId);
      return res.status(200).json({ data: score });
    } catch (error) {
      next(error);
    }
  }
}

export default AnalyticsController;
