import { validationResult } from 'express-validator';
import HeatmapService from '../../application/services/HeatmapService.js';

export class HeatmapController {
  constructor() {
    this.heatmapService = new HeatmapService();
  }

  async getPersonalHeatmap(req, res, next) {
    try {
      const zoom = parseInt(req.query.zoom, 10) || 14;
      const heatmap = await this.heatmapService.getPersonalHeatmap(req.userId, zoom);
      return res.status(200).json({ heatmap });
    } catch (error) {
      next(error);
    }
  }

  async getClubHeatmap(req, res, next) {
    try {
      const zoom = parseInt(req.query.zoom, 10) || 14;
      const heatmap = await this.heatmapService.getClubHeatmap(req.params.clubId, zoom);
      return res.status(200).json({ heatmap });
    } catch (error) {
      next(error);
    }
  }

  async getGlobalHeatmap(req, res, next) {
    try {
      const zoom = parseInt(req.query.zoom, 10) || 14;
      const heatmap = await this.heatmapService.getGlobalHeatmap(zoom);
      return res.status(200).json({ heatmap });
    } catch (error) {
      next(error);
    }
  }

  async generateHeatmap(req, res, next) {
    try {
      const result = await this.heatmapService.generatePersonalHeatmap(req.userId);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default HeatmapController;
