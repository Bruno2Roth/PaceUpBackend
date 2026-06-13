import RacePredictionRepository from '../../data/repositories/RacePredictionRepository.js';
import TrainingSimulationRepository from '../../data/repositories/TrainingSimulationRepository.js';
import { dbPool } from '../../configs/database.js';

const RIEGEL_EXPONENT = 1.06;
const STANDARD_DISTANCES = [5000, 10000, 21097, 42195];

export class RacePredictionService {
  constructor() {
    this.racePredictionRepository = new RacePredictionRepository();
    this.trainingSimulationRepository = new TrainingSimulationRepository();
    this.pool = dbPool.getPool();
  }

  async predictRaceTime(userId, distance) {
    if (!STANDARD_DISTANCES.includes(distance)) {
      const err = new Error('Distance must be one of: 5000, 10000, 21097, 42195');
      err.status = 400;
      throw err;
    }

    const recentEfforts = await this.pool.query(`
      SELECT distance_m, duration_seconds, start_time
      FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND distance_m IS NOT NULL
        AND duration_seconds IS NOT NULL
        AND distance_m > 0
        AND duration_seconds > 0
      ORDER BY start_time DESC
      LIMIT 50
    `, [userId]);

    const vo2maxResult = await this.pool.query(`
      SELECT vo2_max FROM metrics
      WHERE user_id = $1 AND vo2_max IS NOT NULL
      ORDER BY calculated_at DESC
      LIMIT 1
    `, [userId]);

    const vo2max = vo2maxResult.rows[0]?.vo2_max || null;

    if (recentEfforts.rows.length === 0 && !vo2max) {
      const err = new Error('No recent activities or VO2Max data to base prediction on');
      err.status = 400;
      throw err;
    }

    let predictions = [];

    for (const effort of recentEfforts.rows) {
      if (effort.distance_m > 0) {
        const predicted = this.riegelPrediction(effort.distance_m, effort.duration_seconds, distance);
        predictions.push(predicted);
      }
    }

    if (vo2max) {
      const vdotPrediction = this.vdotPrediction(vo2max, distance);
      predictions.push(vdotPrediction);
    }

    if (predictions.length === 0) {
      const err = new Error('Could not generate prediction from available data');
      err.status = 400;
      throw err;
    }

    const avgPrediction = predictions.reduce((s, p) => s + p, 0) / predictions.length;
    const variance = predictions.reduce((s, p) => s + Math.pow(p - avgPrediction, 2), 0) / predictions.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgPrediction;
    const confidence = Math.max(0, Math.min(1, 1 - cv));

    const basedOnActivities = recentEfforts.rows.length;
    const basedOnV02max = vo2max ? 1 : 0;

    const result = {
      userId,
      distance,
      predictedSeconds: Math.round(avgPrediction),
      confidence: parseFloat(confidence.toFixed(4)),
      basedOnActivities,
      basedOnV02max,
    };

    return result;
  }

  riegelPrediction(distance1, time1Seconds, distance2) {
    return time1Seconds * Math.pow(distance2 / distance1, RIEGEL_EXPONENT);
  }

  vdotPrediction(vo2max, distance) {
    const pacePerKmSeconds = (vo2max > 0) ? (3600 / (vo2max * 0.12 + 0.5)) * 60 : 360;
    const totalSeconds = pacePerKmSeconds * (distance / 1000);
    return totalSeconds;
  }

  async getAllPredictions(userId) {
    const results = [];
    for (const distance of STANDARD_DISTANCES) {
      const prediction = await this.predictRaceTime(userId, distance);
      results.push(prediction);
      await this.racePredictionRepository.upsert(userId, distance, prediction);
    }
    return results;
  }

  async simulateTraining(userId, params) {
    const { name, weeks = 8, weeklyDistance = 30, weeklyFrequency = 3, targetDistance } = params;

    if (!targetDistance) {
      const err = new Error('targetDistance is required');
      err.status = 400;
      throw err;
    }

    const currentResult = await this.pool.query(`
      SELECT AVG(distance_m) AS avg_distance, AVG(duration_seconds) AS avg_duration
      FROM activities
      WHERE user_id = $1 AND deleted_at IS NULL AND distance_m IS NOT NULL AND duration_seconds IS NOT NULL
    `, [userId]);

    const avgWeeklyKm = parseFloat(currentResult.rows[0]?.avg_distance) * weeklyFrequency / 1000 || 10;
    const improvementFactor = Math.min(1, (weeklyDistance - avgWeeklyKm) / avgWeeklyKm);
    const predictedImprovement = parseFloat(Math.max(0, Math.min(0.3, improvementFactor * 0.1 * Math.sqrt(weeks / 4))).toFixed(4));

    const fatigueEstimates = [];
    for (let w = 1; w <= weeks; w++) {
      const weeklyLoad = weeklyDistance * weeklyFrequency * (1 + (w / weeks) * 0.3);
      const fatigue = Math.min(1, (weeklyLoad / 200) * (w / weeks));
      fatigueEstimates.push({
        week: w,
        weeklyLoadKm: parseFloat(weeklyLoad.toFixed(1)),
        fatigueScore: parseFloat(fatigue.toFixed(4)),
      });
    }

    const simulation = await this.trainingSimulationRepository.create({
      user_id: userId,
      name: name || `Training for ${targetDistance / 1000}K`,
      weeks,
      weekly_distance: weeklyDistance,
      weekly_frequency: weeklyFrequency,
      target_distance: targetDistance,
      predicted_improvement: predictedImprovement,
      fatigue_estimates: JSON.stringify(fatigueEstimates),
      metadata: JSON.stringify({ avg_weekly_km_before: parseFloat(avgWeeklyKm.toFixed(1)) }),
    });

    return simulation;
  }

  async getSimulations(userId) {
    return this.trainingSimulationRepository.findByUser(userId);
  }
}

export default RacePredictionService;
