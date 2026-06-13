import AiCoachRepository from '../../data/repositories/AiCoachRepository.js';
import redis from '../../configs/redis.js';

const AI_CACHE_PREFIX = 'ai:';
const AI_CACHE_TTL = 600;

export class AiCoachService {
  constructor() {
    this.aiCoachRepository = new AiCoachRepository();
  }

  async getWeeklyReport(userId) {
    const cacheKey = `${AI_CACHE_PREFIX}${userId}:weekly`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const [currentActivities, previousActivities, streaks] = await Promise.all([
      this.aiCoachRepository.getWeeklyActivities(userId, currentWeekStart.toISOString(), endOfWeek.toISOString()),
      this.aiCoachRepository.getWeeklyActivities(userId, previousWeekStart.toISOString(), currentWeekStart.toISOString()),
      this.aiCoachRepository.getStreakData(userId),
    ]);

    const currentDistance = currentActivities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
    const previousDistance = previousActivities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
    const currentDuration = currentActivities.reduce((s, a) => s + (a.duration_seconds || 0), 0) / 3600;
    const currentElevation = currentActivities.reduce((s, a) => s + (a.elevation_gain_m || 0), 0);
    const activityCount = currentActivities.length;

    const avgPace = currentActivities
      .filter(a => a.pace_per_km)
      .reduce((s, a) => s + a.pace_per_km, 0) / Math.max(1, currentActivities.filter(a => a.pace_per_km).length);

    const currentStreak = this.calculateStreak(streaks);
    const diffPercent = previousDistance > 0
      ? Math.round(((currentDistance - previousDistance) / previousDistance) * 100)
      : null;

    const report = {
      period: {
        start: currentWeekStart.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      },
      summary: {
        total_distance_km: Math.round(currentDistance * 100) / 100,
        total_duration_hours: Math.round(currentDuration * 100) / 100,
        total_elevation_m: Math.round(currentElevation),
        activity_count: activityCount,
        average_pace_per_km: avgPace > 0 ? Math.round(avgPace * 100) / 100 : null,
      },
      comparison: {
        previous_week_distance_km: Math.round(previousDistance * 100) / 100,
        difference_percent: diffPercent,
        trend: diffPercent > 10 ? 'improving' : diffPercent < -10 ? 'declining' : 'stable',
      },
      streaks: {
        current_streak: currentStreak.current,
        max_streak: currentStreak.max,
      },
      generated_at: now.toISOString(),
    };

    await redis.set(cacheKey, report, AI_CACHE_TTL);
    await this.saveAnalysis(userId, 'weekly_report', report);

    return report;
  }

  async getRecommendations(userId) {
    const cacheKey = `${AI_CACHE_PREFIX}${userId}:recommendations`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const report = await this.getWeeklyReport(userId);
    const { summary, comparison } = report;

    const tips = [];

    if (summary.activity_count === 0) {
      tips.push({
        type: 'rest',
        priority: 'high',
        message: 'Comienza con un rodaje suave de 20-30 minutos para retomar la rutina.',
      });
    } else if (summary.activity_count < 3) {
      tips.push({
        type: 'easy',
        priority: 'medium',
        message: 'Intenta aumentar a 3-4 sesiones semanales para mejorar tu consistencia.',
      });
    }

    if (comparison.trend === 'declining' && summary.activity_count > 0) {
      tips.push({
        type: 'volume',
        priority: 'low',
        message: 'Tu volumen semanal ha disminuido. Considera agregar una sesión extra.',
      });
    }

    if (summary.total_distance_km > 50) {
      tips.push({
        type: 'recovery',
        priority: 'medium',
        message: 'Alto volumen semanal detectado. Asegúrate de incluir días de recuperación activa.',
      });
    }

    if (summary.total_distance_km < 15 && summary.activity_count > 0) {
      tips.push({
        type: 'quality',
        priority: 'medium',
        message: 'Semana de volumen bajo. Ideal para trabajo de calidad como series o tempo.',
      });
    }

    const avgPace = summary.average_pace_per_km;
    if (avgPace && avgPace > 360) {
      tips.push({
        type: 'tempo',
        priority: 'low',
        message: 'Trabaja en tu ritmo con sesiones de tempo run a ritmo cómodamente rápido.',
      });
    }

    tips.sort((a, b) => a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0);

    const recommendations = { tips, generated_at: new Date().toISOString() };
    await redis.set(cacheKey, recommendations, AI_CACHE_TTL);

    return recommendations;
  }

  async getInsights(userId) {
    const cacheKey = `${AI_CACHE_PREFIX}${userId}:insights`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const [yearSummary, recentSummary, personalBests, streaks] = await Promise.all([
      this.aiCoachRepository.getHistorySummary(userId, yearAgo.toISOString()),
      this.aiCoachRepository.getHistorySummary(userId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      this.aiCoachRepository.getPersonalBests(userId),
      this.aiCoachRepository.getStreakData(userId),
    ]);

    const currentStreak = this.calculateStreak(streaks);

    const insights = [];
    const pbEntries = Object.entries(personalBests);
    if (pbEntries.length > 0) {
      const sorted = pbEntries.sort((a, b) => (a[1].achieved_at > b[1].achieved_at ? -1 : 1));
      const latest = sorted[0];
      const daysAgo = Math.floor(
        (now.getTime() - new Date(latest[1].achieved_at).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysAgo < 30) {
        insights.push({
          type: 'personal_best',
          message: `Nuevo récord personal en ${latest[0]}: ${Math.floor(latest[1].time_seconds / 60)}:${String(latest[1].time_seconds % 60).padStart(2, '0')}`,
          data: latest[1],
        });
      }
    }

    if (currentStreak.current >= 7) {
      insights.push({
        type: 'streak',
        message: `Llevas ${currentStreak.current} días consecutivos de actividad. ¡Sigue así!`,
        data: { streak: currentStreak.current },
      });
    }

    if (recentSummary.total_distance > yearSummary.total_distance / 12 && yearSummary.total_distance > 0) {
      insights.push({
        type: 'volume',
        message: 'Este mes has corrido más que tu promedio mensual. Excelente progreso.',
        data: { monthly_avg: yearSummary.total_distance / 12, current: recentSummary.total_distance },
      });
    }

    if (yearSummary.active_days > 0) {
      const consistency = Math.round((yearSummary.active_days / 365) * 100);
      if (consistency > 50) {
        insights.push({
          type: 'consistency',
          message: `Has sido activo ${consistency}% de los días del último año. Gran consistencia.`,
          data: { consistency_percent: consistency },
        });
      }
    }

    const result = {
      insights,
      totals: {
        year_distance_km: Math.round(yearSummary.total_distance / 1000),
        year_activities: yearSummary.total_activities,
        year_active_days: yearSummary.active_days,
        month_distance_km: Math.round(recentSummary.total_distance / 1000),
        month_activities: recentSummary.total_activities,
      },
      generated_at: now.toISOString(),
    };

    await redis.set(cacheKey, result, AI_CACHE_TTL);
    return result;
  }

  async analyze(userId, analysisType = null) {
    const analysis = {};

    if (!analysisType || analysisType === 'weekly_report') {
      analysis.weeklyReport = await this.getWeeklyReport(userId);
    }
    if (!analysisType || analysisType === 'recommendations') {
      analysis.recommendations = await this.getRecommendations(userId);
    }
    if (!analysisType || analysisType === 'insights') {
      analysis.insights = await this.getInsights(userId);
    }

    const fatigue = await this.detectFatigue(userId);
    analysis.fatigue_detection = fatigue;

    const complete = {
      ...analysis,
      generated_at: new Date().toISOString(),
    };

    await this.saveAnalysis(userId, 'full_analysis', complete);

    return complete;
  }

  async detectFatigue(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activities = await this.aiCoachRepository.getWeeklyActivities(
      userId, sevenDaysAgo.toISOString(), new Date().toISOString()
    );

    const warnings = [];

    const totalLoad = activities.reduce((s, a) => {
      const dist = (a.distance_m || 0) / 1000;
      const dur = (a.duration_seconds || 0) / 3600;
      return s + (dist * 3 + dur * 2);
    }, 0);

    if (totalLoad > 100) {
      warnings.push({
        type: 'high_load',
        severity: 'warning',
        message: 'Carga semanal muy alta. Considera un día de descanso.',
      });
    }

    const consecutiveDays = this.getConsecutiveDays(activities);
    if (consecutiveDays >= 5) {
      warnings.push({
        type: 'no_rest',
        severity: 'warning',
        message: `${consecutiveDays} días consecutivos sin descanso. Tómate al menos un día de recuperación.`,
      });
    }

    const suddenIncrease = this.detectSuddenIncrease(activities);
    if (suddenIncrease) {
      warnings.push({
        type: 'sudden_increase',
        severity: 'alert',
        message: 'Aumento repentino de carga comparado con la semana anterior. Riesgo de sobreentrenamiento.',
      });
    }

    return {
      fatigue_level: warnings.length > 1 ? 'high' : warnings.length === 1 ? 'moderate' : 'low',
      warnings,
      consecutive_days: consecutiveDays,
      weekly_load: Math.round(totalLoad * 100) / 100,
    };
  }

  async saveAnalysis(userId, analysisType, content) {
    return this.aiCoachRepository.create({
      user_id: userId,
      analysis_type: analysisType,
      content,
      created_at: new Date().toISOString(),
    });
  }

  calculateStreak(dates) {
    if (!dates || dates.length === 0) return { current: 0, max: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let current = 0;
    let max = 1;
    let temp = 1;

    const sorted = dates.map(d => new Date(d)).sort((a, b) => b - a);
    const mostRecent = sorted[0];
    const diffFromToday = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));

    if (diffFromToday > 1) {
      current = 0;
    } else {
      current = 1;
    }

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.floor((sorted[i - 1] - sorted[i]) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        temp++;
        if (diffFromToday <= 1 && i === 1) current = temp;
      } else {
        max = Math.max(max, temp);
        temp = 1;
      }
    }
    max = Math.max(max, temp);
    if (diffFromToday <= 1) current = Math.max(current, 1);
    return { current, max };
  }

  getConsecutiveDays(activities) {
    if (activities.length === 0) return 0;

    const days = [...new Set(
      activities.map(a => new Date(a.start_time).toISOString().split('T')[0])
    )].sort((a, b) => new Date(b) - new Date(a));

    if (days.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (days[0] !== today && days[0] !== yesterday) return 0;

    let count = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.floor(
        (new Date(days[i - 1]) - new Date(days[i])) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  detectSuddenIncrease(activities) {
    if (activities.length < 3) return false;

    const now = new Date();
    const thisWeek = activities.filter(a =>
      new Date(a.start_time) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const lastWeek = activities.filter(a => {
      const d = new Date(a.start_time);
      const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return d >= lastWeekStart && d < lastWeekEnd;
    });

    if (thisWeek.length === 0 || lastWeek.length === 0) return false;

    const thisLoad = thisWeek.reduce((s, a) => s + (a.distance_m || 0), 0);
    const lastLoad = lastWeek.reduce((s, a) => s + (a.distance_m || 0), 0);

    return lastLoad > 0 && (thisLoad / lastLoad) > 1.5;
  }
}

export default AiCoachService;
