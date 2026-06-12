import XpService from '../../application/services/XpService.js';

export class XpController {
  constructor() {
    this.xpService = new XpService();
  }

  async getXpStatus(req, res, next) {
    try {
      const status = await this.xpService.getUserXpStatus(req.userId);
      return res.status(200).json({ xp_status: status });
    } catch (error) {
      next(error);
    }
  }

  async getXpHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const history = await this.xpService.getXpHistory(req.userId, limit, offset);
      return res.status(200).json({ history });
    } catch (error) {
      next(error);
    }
  }
}

export default XpController;
