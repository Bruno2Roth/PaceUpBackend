import SegmentService from '../../application/services/SegmentService.js';

export class SegmentController {
  constructor() {
    this.segmentService = new SegmentService();
  }

  async create(req, res, next) {
    try {
      const segment = await this.segmentService.create(req.body, req.userId);
      return res.status(201).json({ segment });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const segments = await this.segmentService.list(req.query);
      return res.status(200).json({ data: segments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const segment = await this.segmentService.getById(req.params.id);
      return res.status(200).json({ segment });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const segment = await this.segmentService.update(req.params.id, req.body, req.userId);
      return res.status(200).json({ segment });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await this.segmentService.delete(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const leaderboard = await this.segmentService.getLeaderboard(req.params.id, limit);
      return res.status(200).json({ leaderboard });
    } catch (error) {
      next(error);
    }
  }

  async getEfforts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const userId = req.userId;
      const efforts = await this.segmentService.getEfforts(req.params.id, userId, limit);
      return res.status(200).json({ efforts });
    } catch (error) {
      next(error);
    }
  }
}

export default SegmentController;
