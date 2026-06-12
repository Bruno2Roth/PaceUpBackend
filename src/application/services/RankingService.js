import RankingRepository from '../../data/repositories/RankingRepository.js';

export class RankingService {
  constructor() {
    this.rankingRepository = new RankingRepository();
  }

  async getGlobalRankings(criteria = 'distance', activityType = null, limit = 100, offset = 0) {
    return this.rankingRepository.getGlobalRankings(criteria, activityType, limit, offset);
  }

  async getUserRank(userId, criteria = 'distance') {
    return this.rankingRepository.getUserRank(userId, criteria);
  }

  async getClubRankings(clubId, criteria = 'distance', limit = 100) {
    return this.rankingRepository.getClubRankings(clubId, criteria, limit);
  }

  async getMonthlyRankings(year, month, criteria = 'distance', limit = 100) {
    return this.rankingRepository.getMonthlyRankings(year, month, criteria, limit);
  }

  async getYearlyRankings(year, criteria = 'distance', limit = 100) {
    return this.rankingRepository.getYearlyRankings(year, criteria, limit);
  }

  async getWeeklyRankings(criteria = 'distance', limit = 100) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return this.rankingRepository.getMonthlyRankings(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth() + 1,
      criteria,
      limit,
    );
  }

  async calculateMonthlyRankings() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return this.rankingRepository.getMonthlyRankings(year, month, 'distance', 100);
  }

  async getLeaderboard(criteria = 'distance', period = 'all', limit = 100, offset = 0) {
    const now = new Date();

    switch (period) {
      case 'weekly': {
        return this.getWeeklyRankings(criteria, limit);
      }
      case 'monthly': {
        return this.getMonthlyRankings(now.getFullYear(), now.getMonth() + 1, criteria, limit);
      }
      case 'yearly': {
        return this.getYearlyRankings(now.getFullYear(), criteria, limit);
      }
      default: {
        return this.getGlobalRankings(criteria, null, limit, offset);
      }
    }
  }
}

export default RankingService;
