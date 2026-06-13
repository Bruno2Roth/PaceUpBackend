import BadgeService from '../../application/services/BadgeService.js';

export class BadgeController {
  constructor() {
    this.badgeService = new BadgeService();
  }

  async getMyBadges(req, res, next) {
    try {
      const badges = await this.badgeService.getUserBadges(req.userId);
      return res.status(200).json({ badges });
    } catch (error) {
      next(error);
    }
  }
}

export default BadgeController;
