import DiscoveryService from '../../application/services/DiscoveryService.js';

export class DiscoveryController {
  constructor() {
    this.discoveryService = new DiscoveryService();
  }

  async getUsers(req, res, next) {
    try {
      const users = await this.discoveryService.discoverUsers(req.query);
      return res.status(200).json({ data: users });
    } catch (error) {
      next(error);
    }
  }

  async getRoutes(req, res, next) {
    try {
      const routes = await this.discoveryService.discoverRoutes(req.query);
      return res.status(200).json({ data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req, res, next) {
    try {
      const events = await this.discoveryService.discoverEvents(req.query);
      return res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  async getClubs(req, res, next) {
    try {
      const clubs = await this.discoveryService.discoverClubs(req.query);
      return res.status(200).json({ data: clubs });
    } catch (error) {
      next(error);
    }
  }
}

export default DiscoveryController;
