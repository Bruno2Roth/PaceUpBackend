import MetricsRepository from '../../data/repositories/MetricsRepository.js';
import redis from '../../configs/redis.js';

const METRICS_CACHE_PREFIX = 'metrics:';
const METRICS_CACHE_TTL = 300;

export class MetricsService {
  constructor() {
    this.metricsRepository = new MetricsRepository();
  }

  async getMetrics(userId) {
    const cacheKey = `${METRICS_CACHE_PREFIX}${userId}:latest`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const metrics = await this.metricsRepository.findLatestByUserId(userId);
    if (metrics) {
      await redis.set(cacheKey, metrics, METRICS_CACHE_TTL);
    }
    return metrics || {};
  }

  async getMetricsHistory(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.metricsRepository.getHistoryByDateRange(
      userId, startDate.toISOString(), endDate.toISOString()
    );
  }

  async calculateMetrics(userId) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fortyTwoDaysAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);

    const [
      recentActivities,
      monthActivities,
      userInfo,
    ] = await Promise.all([
      this.metricsRepository.getActivitiesForLoad(userId, sevenDaysAgo.toISOString()),
      this.metricsRepository.getActivitiesForLoad(userId, fortyTwoDaysAgo.toISOString()),
      this.metricsRepository.getUserAge(userId),
    ]);

    const age = userInfo?.date_of_birth
      ? Math.floor((now - new Date(userInfo.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const vo2Max = this.calculateVO2Max(recentActivities, age);
    const trainingLoad = this.calculateTrainingLoad(recentActivities);
    const acuteLoad = this.calculateAcuteLoad(recentActivities);
    const chronicLoad = this.calculateChronicLoad(monthActivities);
    const fatigueScore = this.calculateFatigue(acuteLoad, chronicLoad);
    const recoveryScore = this.calculateRecovery(recentActivities, chronicLoad);
    const fitnessScore = this.calculateFitness(monthActivities);
    const runningEfficiency = this.calculateRunningEfficiency(recentActivities, chronicLoad);

    const metric = await this.metricsRepository.create({
      user_id: userId,
      vo2_max: vo2Max,
      training_load: trainingLoad,
      acute_load: acuteLoad,
      chronic_load: chronicLoad,
      fatigue_score: fatigueScore,
      recovery_score: recoveryScore,
      fitness_score: fitnessScore,
      running_efficiency: runningEfficiency,
      calculated_at: now.toISOString(),
    });

    const cacheKey = `${METRICS_CACHE_PREFIX}${userId}:latest`;
    await redis.set(cacheKey, metric, METRICS_CACHE_TTL);

    return metric;
  }

  calculateVO2Max(activities, age) {
    if (activities.length === 0) return null;

    const recent = activities.filter(a =>
      a.start_time >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

    if (recent.length === 0) return null;

    const bestPace = Math.min(...recent.map(a => a.pace_per_km).filter(Boolean));
    if (!bestPace || bestPace <= 0) return null;

    const speedMps = 1000 / bestPace;
    const speedKmph = speedMps * 3.6;

    let vo2 = speedKmph * 3.5;

    if (age) {
      vo2 = vo2 - (age * 0.4);
    }

    return Math.round(vo2 * 100) / 100;
  }

  calculateTrainingLoad(activities) {
    if (activities.length === 0) return 0;

    return Math.round(
      activities.reduce((sum, a) => {
        const distanceFactor = (a.distance_m || 0) / 1000;
        const durationFactor = (a.duration_seconds || 0) / 3600;
        const elevationFactor = ((a.elevation_gain_m || 0) / 100) * 0.3;
        const intensityFactor = a.average_heartrate
          ? (a.average_heartrate / 180) * 0.5
          : 0.5;

        const load = (distanceFactor * 3 + durationFactor * 2 + elevationFactor + intensityFactor) * 10;
        return sum + load;
      }, 0) * 100
    ) / 100;
  }

  calculateAcuteLoad(activities) {
    if (activities.length === 0) return 0;
    return Math.round(this.calculateTrainingLoad(activities) * 100) / 100;
  }

  calculateChronicLoad(activities) {
    if (activities.length === 0) return 0;

    const weeklyLoads = [];
    const now = new Date();

    for (let w = 0; w < 6; w++) {
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weekActivities = activities.filter(a => {
        const d = new Date(a.start_time);
        return d >= weekStart && d < weekEnd;
      });

      weeklyLoads.push(this.calculateTrainingLoad(weekActivities));
    }

    const avg = weeklyLoads.reduce((s, l) => s + l, 0) / weeklyLoads.length;
    return Math.round(avg * 100) / 100;
  }

  calculateFatigue(acuteLoad, chronicLoad) {
    if (chronicLoad <= 0) return 0;
    const ratio = acuteLoad / chronicLoad;

    if (ratio > 1.5) return Math.min(100, Math.round((ratio - 1) * 100));
    if (ratio > 1.3) return Math.round((ratio - 1) * 80);
    if (ratio > 1.1) return Math.round((ratio - 1) * 50);
    return Math.round(ratio * 20);
  }

  calculateRecovery(activities, chronicLoad) {
    if (activities.length === 0 && chronicLoad <= 0) return 100;

    const restDays = this.countRestDays(activities);
    const restScore = Math.min(restDays * 15, 60);

    const recentLoad = this.calculateTrainingLoad(activities);
    const loadScore = chronicLoad > 0
      ? Math.max(0, 40 - Math.round((recentLoad / chronicLoad) * 20))
      : 40;

    return Math.min(100, restScore + loadScore);
  }

  calculateFitness(activities) {
    if (activities.length === 0) return 0;

    const totalDistance = activities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
    const avgDuration = activities.reduce((s, a) => s + (a.duration_seconds || 0), 0) / activities.length;
    const avgPace = activities.filter(a => a.pace_per_km).reduce((s, a) => s + a.pace_per_km, 0) /
      Math.max(1, activities.filter(a => a.pace_per_km).length);

    const volumeScore = Math.min(40, Math.round(totalDistance * 0.5));
    const consistencyScore = Math.min(30, Math.round(activities.length * 3));
    const paceScore = avgPace > 0 ? Math.max(0, 30 - Math.round((avgPace - 240) / 10)) : 0;

    return Math.min(100, volumeScore + consistencyScore + paceScore);
  }

  calculateRunningEfficiency(activities) {
    if (activities.length < 2) return 50;

    const withPace = activities.filter(a => a.pace_per_km && a.pace_per_km > 0);
    if (withPace.length < 2) return 50;

    const recentPaces = withPace.slice(-5).map(a => a.pace_per_km);
    const avgPace = recentPaces.reduce((s, p) => s + p, 0) / recentPaces.length;

    const totalDistance = activities.reduce((s, a) => s + (a.distance_m || 0), 0) / 1000;
    if (totalDistance <= 0) return 50;

    const efficiency = Math.max(0, 100 - Math.round(avgPace / 5));
    return Math.min(100, efficiency);
  }

  countRestDays(activities) {
    if (activities.length === 0) return 7;

    const activeDates = new Set(
      activities.map(a => new Date(a.start_time).toISOString().split('T')[0])
    );

    let restDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      if (!activeDates.has(d)) restDays++;
    }
    return restDays;
  }

  async getTrainingLoad(userId) {
    const metrics = await this.getMetrics(userId);
    return {
      acute_load: metrics.acute_load || 0,
      chronic_load: metrics.chronic_load || 0,
      training_load: metrics.training_load || 0,
      ratio: metrics.chronic_load > 0
        ? Math.round((metrics.acute_load / metrics.chronic_load) * 100) / 100
        : null,
    };
  }

  async getRecovery(userId) {
    const metrics = await this.getMetrics(userId);
    return {
      recovery_score: metrics.recovery_score || 100,
      fatigue_score: metrics.fatigue_score || 0,
      status: metrics.recovery_score >= 70 ? 'ready'
        : metrics.recovery_score >= 40 ? 'moderate'
        : 'low',
    };
  }

  async getFitness(userId) {
    const metrics = await this.getMetrics(userId);
    return {
      fitness_score: metrics.fitness_score || 0,
      vo2_max: metrics.vo2_max,
      running_efficiency: metrics.running_efficiency || 50,
    };
  }
}

export default MetricsService;
