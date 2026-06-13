import { validationResult } from 'express-validator';
import RouteService from '../../application/services/RouteService.js';

export class RouteController {
  constructor() {
    this.routeService = new RouteService();
  }

  async createRoute(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const route = await this.routeService.createRoute(req.userId, req.body);
      return res.status(201).json({ route });
    } catch (error) {
      next(error);
    }
  }

  async getRoute(req, res, next) {
    try {
      const route = await this.routeService.getRouteById(req.params.id);
      return res.status(200).json({ route });
    } catch (error) {
      next(error);
    }
  }

  async getPublicRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const routes = await this.routeService.getRoutes(req.userId, { public: true, limit, offset });
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getUserRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const routes = await this.routeService.getRoutes(req.params.id, { limit, offset });
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async searchRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const { q, city, difficulty } = req.query;
      const routes = await this.routeService.getRoutes(req.userId, {
        q, city, difficulty, limit, offset, public: true,
      });
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async updateRoute(req, res, next) {
    try {
      const route = await this.routeService.updateRoute(req.params.id, req.userId, req.body);
      return res.status(200).json({ route });
    } catch (error) {
      next(error);
    }
  }

  async deleteRoute(req, res, next) {
    try {
      const result = await this.routeService.deleteRoute(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPopularRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const routes = await this.routeService.getPopularRoutes(limit);
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getNearbyRoutes(req, res, next) {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) || 10;
      const limit = parseInt(req.query.limit, 10) || 20;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng query parameters required' });
      }

      const routes = await this.routeService.getNearbyRoutes(lat, lng, radius, limit);
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getFavoriteRoutes(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const routes = await this.routeService.getFavoriteRoutes(req.userId, limit, offset);
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req, res, next) {
    try {
      const route = await this.routeService.toggleFavorite(req.params.id, req.userId);
      return res.status(200).json({ route });
    } catch (error) {
      next(error);
    }
  }
}

export default RouteController;
