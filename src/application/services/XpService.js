import XpEventRepository from '../../data/repositories/XpEventRepository.js';
import XpHistoryRepository from '../../data/repositories/XpHistoryRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import { LEVELS } from '../../constants/levels.js';

export class XpService {
  constructor() {
    this.xpEventRepository = new XpEventRepository();
    this.xpHistoryRepository = new XpHistoryRepository();
    this.userRepository = new UserRepository();
  }

  async awardXp(userId, eventKey, { activityId, challengeId, achievementId } = {}) {
    const event = await this.xpEventRepository.findByEventKey(eventKey);
    if (!event) return null;

    const xpAmount = event.xp_amount;

    const historyEntry = await this.xpHistoryRepository.create({
      user_id: userId,
      xp_event_id: event.id,
      xp_amount: xpAmount,
      activity_id: activityId || null,
      challenge_id: challengeId || null,
      achievement_id: achievementId || null,
    });

    const user = await this.userRepository.findById(userId);
    const newXp = (user.xp || 0) + xpAmount;
    const newLevel = this.calculateLevel(newXp);

    const updateData = { xp: newXp };
    if (newLevel !== user.level) {
      updateData.level = newLevel;
    }

    await this.userRepository.update(userId, updateData);

    const leveledUp = newLevel !== user.level;

    return { historyEntry, xpAmount, newXp, newLevel, leveledUp };
  }

  async getXpHistory(userId, limit = 50, offset = 0) {
    return this.xpHistoryRepository.findByUserId(userId, limit, offset);
  }

  async getUserXpStatus(userId) {
    const user = await this.userRepository.findNonDeletedById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const currentXp = user.xp || 0;
    const currentLevel = user.level || 1;
    const nextLevel = this.getNextLevel(currentLevel);
    const prevThreshold = this.getXpForLevel(currentLevel);
    const nextThreshold = nextLevel ? this.getXpForLevel(nextLevel.level) : currentXp;
    const xpToNext = nextLevel ? nextThreshold - currentXp : 0;
    const progress = nextLevel && nextThreshold > prevThreshold
      ? Math.min(100, Math.round(((currentXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
      : 100;

    return {
      current_xp: currentXp,
      current_level: currentLevel,
      xp_to_next_level: xpToNext,
      progress_percent: progress,
      next_level: nextLevel ? nextLevel.level : null,
      total_levels: LEVELS.length,
    };
  }

  calculateLevel(xp) {
    let level = 1;
    for (const l of LEVELS) {
      if (xp >= l.xp) {
        level = l.level;
      }
    }
    return level;
  }

  getNextLevel(currentLevel) {
    return LEVELS.find((l) => l.level === currentLevel + 1) || null;
  }

  getXpForLevel(level) {
    const found = LEVELS.find((l) => l.level === level);
    return found ? found.xp : 0;
  }
}

export default XpService;
