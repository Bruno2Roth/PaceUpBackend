import AchievementService from '../../application/services/AchievementService.js';

export class AchievementController {
  constructor() {
    this.achievementService = new AchievementService();
  }

  async getUserAchievements(req, res, next) {
    try {
      const achievements = await this.achievementService.getUserAchievements(req.userId);
      return res.status(200).json({ achievements });
    } catch (error) {
      next(error);
    }
  }

  async getAchievementCount(req, res, next) {
    try {
      const count = await this.achievementService.getAchievementCount(req.userId);
      return res.status(200).json({ count });
    } catch (error) {
      next(error);
    }
  }
}

export default AchievementController;
