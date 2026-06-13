import { validationResult } from 'express-validator';
import AiCoachService from '../../application/services/AiCoachService.js';

export class AiCoachController {
  constructor() {
    this.aiCoachService = new AiCoachService();
  }

  async getWeeklyReport(req, res, next) {
    try {
      const report = await this.aiCoachService.getWeeklyReport(req.userId);
      return res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 5;
      const recommendations = await this.aiCoachService.getRecommendations(req.userId);
      return res.status(200).json({ recommendations });
    } catch (error) {
      next(error);
    }
  }

  async getInsights(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const insights = await this.aiCoachService.getInsights(req.userId);
      return res.status(200).json({ insights });
    } catch (error) {
      next(error);
    }
  }

  async analyzeActivity(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const analysis = await this.aiCoachService.analyze(req.userId);
      return res.status(200).json({ analysis });
    } catch (error) {
      next(error);
    }
  }
}

export default AiCoachController;
