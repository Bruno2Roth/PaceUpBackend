import { TrainingPlanRepository, TrainingPlanWeekRepository, TrainingPlanSessionRepository } from '../../data/repositories/TrainingPlanRepository.js';
import AiCoachRepository from '../../data/repositories/AiCoachRepository.js';
import redis from '../../configs/redis.js';

const PLAN_CACHE_PREFIX = 'plan:';
const PLAN_CACHE_TTL = 300;

const GOAL_DISTANCES = {
  '5K': { baseWeeklyKm: 20, weeks: 8, longRunMax: 10 },
  '10K': { baseWeeklyKm: 30, weeks: 10, longRunMax: 16 },
  '21K': { baseWeeklyKm: 40, weeks: 12, longRunMax: 21 },
  '42K': { baseWeeklyKm: 50, weeks: 16, longRunMax: 35 },
};

const LEVEL_MULTIPLIER = {
  beginner: 0.7,
  intermediate: 1.0,
  advanced: 1.3,
};

const SESSION_TYPES = ['easy', 'tempo', 'intervals', 'long_run', 'recovery', 'rest'];
const INTENSITY_PATTERNS = {
  beginner: { easy: 0.6, tempo: 0.1, intervals: 0, long_run: 0.2, recovery: 0.1 },
  intermediate: { easy: 0.4, tempo: 0.2, intervals: 0.15, long_run: 0.15, recovery: 0.1 },
  advanced: { easy: 0.3, tempo: 0.2, intervals: 0.2, long_run: 0.2, recovery: 0.1 },
};

export class TrainingPlanService {
  constructor() {
    this.planRepository = new TrainingPlanRepository();
    this.weekRepository = new TrainingPlanWeekRepository();
    this.sessionRepository = new TrainingPlanSessionRepository();
    this.aiCoachRepository = new AiCoachRepository();
  }

  async generatePlan(userId, goal, level, startDate = null) {
    const goalConfig = GOAL_DISTANCES[goal];
    if (!goalConfig) {
      const err = new Error('Invalid goal. Must be 5K, 10K, 21K, or 42K');
      err.status = 400;
      throw err;
    }

    const multiplier = LEVEL_MULTIPLIER[level] || 1.0;
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + goalConfig.weeks * 7);

    const existing = await this.planRepository.findActiveByUserId(userId);
    if (existing) {
      existing.is_active = false;
      await this.planRepository.update(existing.id, { is_active: false });
    }

    const plan = await this.planRepository.create({
      user_id: userId,
      goal,
      level,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      week_count: goalConfig.weeks,
      is_active: true,
      is_paused: false,
      metadata: JSON.stringify({ base_weekly_km: goalConfig.baseWeeklyKm * multiplier }),
    });

    const intensity = INTENSITY_PATTERNS[level] || INTENSITY_PATTERNS.intermediate;
    const weeks = [];

    for (let w = 0; w < goalConfig.weeks; w++) {
      const progress = w / goalConfig.weeks;
      const weeklyKm = goalConfig.baseWeeklyKm * multiplier * (0.5 + progress * 0.5);

      const week = await this.weekRepository.create({
        plan_id: plan.id,
        week_number: w + 1,
        total_distance: weeklyKm,
        total_duration: Math.round(weeklyKm * 6),
        description: `Semana ${w + 1}: ${w < goalConfig.weeks / 3 ? 'Fase base' : w < goalConfig.weeks * 2 / 3 ? 'Fase de construcción' : 'Fase de pico/taper'}`,
      });

      const sessions = this.generateWeekSessions(week.id, w, goalConfig, intensity, multiplier, level);
      weeks.push({ week, sessions });
    }

    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return this.getPlanWithDetails(plan.id);
  }

  generateWeekSessions(weekId, weekIndex, goalConfig, intensity, multiplier, level) {
    const sessions = [];
    const weeklyKm = goalConfig.baseWeeklyKm * multiplier * (0.5 + (weekIndex / goalConfig.weeks) * 0.5);
    const longRunKm = Math.min(goalConfig.longRunMax * multiplier, weeklyKm * 0.35);
    const easyPace = 300 + Math.round((1 - multiplier) * 30);
    const tempoPace = Math.round(easyPace * 0.85);
    const intervalPace = Math.round(easyPace * 0.75);

    const isTaper = weekIndex >= goalConfig.weeks - 2;
    const isPeak = weekIndex >= goalConfig.weeks * 0.6 && weekIndex < goalConfig.weeks - 2;

    const daySchedule = [
      { type: 'easy', dist: weeklyKm * intensity.easy * 0.25, pace: easyPace + 15 },
      { type: 'tempo', dist: weeklyKm * intensity.tempo * 0.5, pace: tempoPace },
      { type: 'rest', dist: 0, pace: null },
      { type: 'intervals', dist: weeklyKm * intensity.intervals * 0.5, pace: intervalPace },
      { type: 'easy', dist: weeklyKm * intensity.easy * 0.2, pace: easyPace + 10 },
      { type: 'recovery', dist: weeklyKm * intensity.recovery * 0.3, pace: easyPace + 30 },
      { type: 'long_run', dist: isPeak ? longRunKm : longRunKm * 0.8, pace: easyPace + 20 },
    ];

    if (isTaper) {
      daySchedule[6].dist = longRunKm * 0.6;
    }

    for (let d = 0; d < 7; d++) {
      const session = daySchedule[d];
      if (session.type === 'rest') {
        sessions.push({
          week_id: weekId,
          day_of_week: d,
          session_type: 'rest',
          description: 'Descanso',
          distance_goal: 0,
          duration_goal: 0,
          pace_goal_min: null,
          pace_goal_max: null,
        });
        continue;
      }

      const dist = Math.round(session.dist * 100) / 100;
      const duration = dist > 0 ? Math.round(dist * (session.pace || easyPace) / 60) : 0;

      if (dist <= 0) continue;

      sessions.push({
        week_id: weekId,
        day_of_week: d,
        session_type: session.type,
        description: this.getSessionDescription(session.type, dist),
        distance_goal: dist,
        duration_goal: duration,
        pace_goal_min: session.pace ? Math.round(session.pace * 0.95) : null,
        pace_goal_max: session.pace ? Math.round(session.pace * 1.05) : null,
      });
    }

    return Promise.all(
      sessions.map(s => this.sessionRepository.create(s))
    );
  }

  getSessionDescription(type, distance) {
    const descs = {
      easy: `Rodaje suave de ${Math.round(distance * 10) / 10} km`,
      tempo: `Tempo run de ${Math.round(distance * 10) / 10} km a ritmo cómodamente rápido`,
      intervals: `Series de ${Math.round(distance * 10) / 10} km: 4-6 repeticiones con recuperación`,
      long_run: `Rodaje largo de ${Math.round(distance * 10) / 10} km`,
      recovery: `Recuperación activa de ${Math.round(distance * 10) / 10} km a ritmo muy suave`,
      hills: `Entrenamiento de cuestas: 6-8 repeticiones`,
      threshold: `Umbral: ${Math.round(distance * 10) / 10} km al ritmo de umbral`,
    };
    return descs[type] || `Sesión de ${Math.round(distance * 10) / 10} km`;
  }

  async getCurrentPlan(userId) {
    const plan = await this.planRepository.findActiveByUserId(userId);
    if (!plan) return null;
    return this.getPlanWithDetails(plan.id);
  }

  async getPlanById(planId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    return this.getPlanWithDetails(planId);
  }

  async getPlanWithDetails(planId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) return null;

    const weeks = await this.weekRepository.findByPlanId(planId);
    const weeksWithSessions = await Promise.all(
      weeks.map(async (week) => {
        const sessions = await this.sessionRepository.findByWeekId(week.id);
        return { ...week, sessions };
      })
    );

    const completion = await this.sessionRepository.getCompletionRate(planId);

    return {
      ...plan,
      weeks: weeksWithSessions,
      progress: {
        total_sessions: completion.total,
        completed_sessions: completion.completed,
        completion_percent: completion.total > 0
          ? Math.round((completion.completed / completion.total) * 100) : 0,
      },
    };
  }

  async updatePlan(planId, userId, data) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    if (plan.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const updated = await this.planRepository.update(planId, data);
    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return this.getPlanWithDetails(planId);
  }

  async deletePlan(planId, userId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    if (plan.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    await this.planRepository.softDelete(planId);
    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return { message: 'Plan deleted' };
  }

  async pausePlan(planId, userId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    if (plan.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const updated = await this.planRepository.update(planId, { is_paused: true });
    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return updated;
  }

  async resumePlan(planId, userId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    if (plan.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const updated = await this.planRepository.update(planId, { is_paused: false });
    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return updated;
  }

  async recalculatePlan(planId, userId) {
    const plan = await this.planRepository.findNonDeletedById(planId);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    if (plan.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const incomplete = await this.sessionRepository.findIncompleteByPlan(planId);
    const missedSessions = incomplete.length;

    const now = new Date();
    const startDate = new Date(plan.start_date);
    const daysElapsed = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.min(plan.week_count, Math.max(1, Math.floor(daysElapsed / 7) + 1));

    if (missedSessions > currentWeek * 2) {
      const adjustment = Math.max(0.7, 1 - (missedSessions / (plan.week_count * 4)));
      const metadata = plan.metadata || {};
      if (typeof metadata === 'string') metadata = JSON.parse(metadata);
      metadata.adjusted_at = now.toISOString();
      metadata.adjustment_factor = adjustment;
      metadata.missed_sessions = missedSessions;

      await this.planRepository.update(planId, {
        metadata: JSON.stringify(metadata),
        week_count: plan.week_count + Math.ceil(missedSessions / 3),
        end_date: new Date(now.getTime() + (plan.week_count + Math.ceil(missedSessions / 3)) * 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
      });
    }

    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return this.getPlanWithDetails(planId);
  }

  async completeSession(sessionId, userId, completedData) {
    const cacheKey = `${PLAN_CACHE_PREFIX}${userId}:current`;
    await redis.delete(cacheKey);

    return this.sessionRepository.update(sessionId, {
      is_completed: true,
      completed_distance: completedData.distance_m || 0,
      completed_duration: completedData.duration_seconds || 0,
      notes: completedData.notes || null,
    });
  }
}

export default TrainingPlanService;
