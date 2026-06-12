import ChallengeService from '../../application/services/ChallengeService.js';

export class ChallengeController {
  constructor() {
    this.challengeService = new ChallengeService();
  }

  async createChallenge(req, res, next) {
    try {
      const challenge = await this.challengeService.createChallenge(req.userId, req.body);
      return res.status(201).json({ challenge });
    } catch (error) {
      next(error);
    }
  }

  async getChallenge(req, res, next) {
    try {
      const challenge = await this.challengeService.getChallenge(req.params.id, req.userId);
      return res.status(200).json({ challenge });
    } catch (error) {
      next(error);
    }
  }

  async getActiveChallenges(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const challenges = await this.challengeService.getActiveChallenges(limit, offset);
      return res.status(200).json({ challenges });
    } catch (error) {
      next(error);
    }
  }

  async searchChallenges(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const challenges = await this.challengeService.searchChallenges(req.query.q, limit, offset);
      return res.status(200).json({ challenges });
    } catch (error) {
      next(error);
    }
  }

  async joinChallenge(req, res, next) {
    try {
      const result = await this.challengeService.joinChallenge(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async leaveChallenge(req, res, next) {
    try {
      const result = await this.challengeService.leaveChallenge(req.params.id, req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getChallengeLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const leaderboard = await this.challengeService.getChallengeLeaderboard(req.params.id, limit, offset);
      return res.status(200).json({ leaderboard });
    } catch (error) {
      next(error);
    }
  }

  async getUserChallenges(req, res, next) {
    try {
      const status = req.query.status || 'active';
      const challenges = await this.challengeService.getUserChallenges(req.params.id, status);
      return res.status(200).json({ challenges });
    } catch (error) {
      next(error);
    }
  }
}

export default ChallengeController;
