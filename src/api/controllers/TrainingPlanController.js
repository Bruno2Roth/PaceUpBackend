import { validationResult } from 'express-validator';
import TrainingPlanService from '../../application/services/TrainingPlanService.js';

export class TrainingPlanController {
  constructor() {
    this.trainingPlanService = new TrainingPlanService();
  }

  async createPlan(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { goal, level, start_date } = req.body;
      const plan = await this.trainingPlanService.generatePlan(req.userId, goal, level, start_date);
      return res.status(201).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentPlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.getCurrentPlan(req.userId);
      if (!plan) {
        return res.status(404).json({ error: 'No active training plan' });
      }
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async getPlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.getPlanById(req.params.id);
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.updatePlan(req.params.id, req.userId, req.body);
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req, res, next) {
    try {
      const result = await this.trainingPlanService.deletePlan(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async pausePlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.pausePlan(req.params.id, req.userId);
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async resumePlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.resumePlan(req.params.id, req.userId);
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async recalculatePlan(req, res, next) {
    try {
      const plan = await this.trainingPlanService.recalculatePlan(req.params.id, req.userId);
      return res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const session = await this.trainingPlanService.completeSession(req.params.sessionId, req.userId, req.body);
      return res.status(200).json({ session });
    } catch (error) {
      next(error);
    }
  }
}

export default TrainingPlanController;
