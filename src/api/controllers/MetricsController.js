import { validationResult } from 'express-validator';
import MetricsService from '../../application/services/MetricsService.js';

export class MetricsController {
  constructor() {
    this.metricsService = new MetricsService();
  }

  async getMyMetrics(req, res, next) {
    try {
      const metrics = await this.metricsService.getMetrics(req.userId);
      return res.status(200).json({ metrics });
    } catch (error) {
      next(error);
    }
  }

  async getMetricsHistory(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const history = await this.metricsService.getMetricsHistory(req.userId, days);
      return res.status(200).json({ history });
    } catch (error) {
      next(error);
    }
  }

  async getTrainingLoad(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 7;
      const load = await this.metricsService.getTrainingLoad(req.userId);
      return res.status(200).json({ load });
    } catch (error) {
      next(error);
    }
  }

  async getRecoveryStatus(req, res, next) {
    try {
      const recovery = await this.metricsService.getRecovery(req.userId);
      return res.status(200).json({ recovery });
    } catch (error) {
      next(error);
    }
  }

  async getFitnessTrend(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const fitness = await this.metricsService.getFitness(req.userId);
      return res.status(200).json({ fitness });
    } catch (error) {
      next(error);
    }
  }
}

export default MetricsController;
