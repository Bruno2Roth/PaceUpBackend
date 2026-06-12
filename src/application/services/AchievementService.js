import AchievementRepository from '../../data/repositories/AchievementRepository.js';
import ActivityRepository from '../../data/repositories/ActivityRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import XpService from './XpService.js';
import NotificationService from './NotificationService.js';

const ACHIEVEMENT_DEFS = {
  first_activity: {
    title: 'Primer entrenamiento',
    description: 'Completa tu primera actividad',
    icon_url: '/achievements/first_run.png',
  },
  distance_5k: {
    title: 'Primer 5K',
    description: 'Completa una actividad de 5 km',
    icon_url: '/achievements/5k.png',
  },
  distance_10k: {
    title: 'Primer 10K',
    description: 'Completa una actividad de 10 km',
    icon_url: '/achievements/10k.png',
  },
  distance_21k: {
    title: 'Primer 21K',
    description: 'Completa una media maratón',
    icon_url: '/achievements/21k.png',
  },
  distance_42k: {
    title: 'Primer 42K',
    description: 'Completa una maratón',
    icon_url: '/achievements/42k.png',
  },
  total_100km: {
    title: '100 km',
    description: 'Acumula 100 km en total',
    icon_url: '/achievements/100km.png',
  },
  total_500km: {
    title: '500 km',
    description: 'Acumula 500 km en total',
    icon_url: '/achievements/500km.png',
  },
  total_1000km: {
    title: '1000 km',
    description: 'Acumula 1000 km en total',
    icon_url: '/achievements/1000km.png',
  },
  streak_3: {
    title: 'Racha de 3 días',
    description: 'Entrena 3 días consecutivos',
    icon_url: '/achievements/streak_3.png',
  },
  streak_7: {
    title: 'Racha de 7 días',
    description: 'Entrena 7 días consecutivos',
    icon_url: '/achievements/streak_7.png',
  },
  streak_30: {
    title: 'Racha de 30 días',
    description: 'Entrena 30 días consecutivos',
    icon_url: '/achievements/streak_30.png',
  },
};

export class AchievementService {
  constructor() {
    this.achievementRepository = new AchievementRepository();
    this.activityRepository = new ActivityRepository();
    this.userRepository = new UserRepository();
    this.xpService = new XpService();
    this.notificationService = new NotificationService();
  }

  async getUserAchievements(userId) {
    return this.achievementRepository.findByUserId(userId);
  }

  async getAchievementCount(userId) {
    return this.achievementRepository.countByUserId(userId);
  }

  async evaluateAndAward(userId, activity = null) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) return [];

    const stats = await this.activityRepository.getActivityStats(userId);
    const totalDistance = parseFloat(stats.total_distance) || 0;
    const totalActivities = parseInt(stats.total_activities, 10) || 0;
    const streakDates = await this.activityRepository.getStreakData(userId);

    const { currentStreak } = this.calculateStreaks(streakDates);

    const distanceM = activity ? parseFloat(activity.distance_m) || 0 : 0;

    const checks = [
      { type: 'first_activity', condition: totalActivities >= 1, isMilestone: true },
      { type: 'distance_5k', condition: distanceM >= 5000, isMilestone: true },
      { type: 'distance_10k', condition: distanceM >= 10000, isMilestone: true },
      { type: 'distance_21k', condition: distanceM >= 21097, isMilestone: true },
      { type: 'distance_42k', condition: distanceM >= 42195, isMilestone: true },
      { type: 'total_100km', condition: totalDistance >= 100000, isMilestone: false },
      { type: 'total_500km', condition: totalDistance >= 500000, isMilestone: false },
      { type: 'total_1000km', condition: totalDistance >= 1000000, isMilestone: false },
      { type: 'streak_3', condition: currentStreak >= 3, isMilestone: false },
      { type: 'streak_7', condition: currentStreak >= 7, isMilestone: false },
      { type: 'streak_30', condition: currentStreak >= 30, isMilestone: false },
    ];

    const awarded = [];

    for (const check of checks) {
      if (!check.condition) continue;

      const alreadyHas = await this.achievementRepository.hasAchievement(userId, check.type);
      if (alreadyHas) continue;

      const def = ACHIEVEMENT_DEFS[check.type];
      if (!def) continue;

      const achievement = await this.achievementRepository.create({
        user_id: userId,
        achievement_type: check.type,
        title: def.title,
        description: def.description,
        icon_url: def.icon_url,
        metadata: {},
      });

      await this.xpService.awardXp(userId, 'achievement_earned', { achievementId: achievement.id });

      await this.notificationService.notifyAchievement(userId, achievement);

      awarded.push(achievement);
    }

    return awarded;
  }

  calculateStreaks(dates) {
    if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let maxStreak = 1;
    let tempStreak = 1;

    const sorted = dates.map((d) => new Date(d)).sort((a, b) => b - a);
    const mostRecent = sorted[0];
    const diffFromToday = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));

    if (diffFromToday > 1) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
    }

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.floor((sorted[i - 1] - sorted[i]) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
        if (diffFromToday <= 1 && i === 1) currentStreak = tempStreak;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    if (diffFromToday <= 1) currentStreak = Math.max(currentStreak, 1);
    return { currentStreak, maxStreak };
  }

  async evaluateMilestoneAchievements(userId, activity) {
    if (!activity) return [];
    return this.evaluateAndAward(userId, activity);
  }

  async checkAndAwardOnActivity(userId, activity) {
    return this.evaluateMilestoneAchievements(userId, activity);
  }
}

export default AchievementService;
