import { TrainingWizardSessionRepository, TrainingWizardAnswerRepository } from '../../data/repositories/TrainingWizardRepository.js';
import { TrainingPlanRepository, TrainingPlanWeekRepository, TrainingPlanSessionRepository } from '../../data/repositories/TrainingPlanRepository.js';

const QUESTIONS = [
  { key: 'goal', label: 'Objetivo', step: 0 },
  { key: 'target_date', label: 'Fecha objetivo', step: 1 },
  { key: 'target_time', label: 'Marca objetivo', step: 2 },
  { key: 'level', label: 'Nivel actual', step: 3 },
  { key: 'experience', label: 'Experiencia', step: 4 },
  { key: 'weekly_volume', label: 'Volumen semanal', step: 5 },
  { key: 'frequency', label: 'Frecuencia semanal', step: 6 },
  { key: 'available_days', label: 'Días disponibles', step: 7 },
  { key: 'session_duration', label: 'Duración por entrenamiento', step: 8 },
  { key: 'recent_pb', label: 'Mejores marcas', step: 9 },
  { key: 'injuries', label: 'Lesiones', step: 10 },
  { key: 'terrain', label: 'Tipo de terreno', step: 11 },
  { key: 'equipment', label: 'Equipamiento', step: 12 },
  { key: 'intensity', label: 'Exigencia', step: 13 },
];

const QUESTION_CONFIG = {
  goal: {
    label: '¿Qué objetivo tenés?',
    type: 'select',
    options: ['5K', '10K', '15K', '21K', '42K', 'Trail Running', 'Mejorar estado físico'],
  },
  target_date: {
    label: '¿Cuándo es tu carrera o fecha objetivo?',
    type: 'date',
  },
  target_time: {
    label: '¿Qué tiempo querés lograr?',
    type: 'text',
    placeholder: 'Ej: Sub 40 en 10K, Sub 1:30 en 21K, Completar maratón',
  },
  level: {
    label: '¿Cuál es tu nivel actual?',
    type: 'select',
    options: ['Principiante', 'Intermedio', 'Avanzado'],
  },
  experience: {
    label: '¿Cuánto tiempo llevás corriendo?',
    type: 'experience',
  },
  weekly_volume: {
    label: '¿Cuántos kilómetros corrés por semana?',
    type: 'number',
    unit: 'km',
    min: 0,
    max: 200,
  },
  frequency: {
    label: '¿Cuántos días por semana podés entrenar?',
    type: 'range',
    min: 1,
    max: 7,
  },
  available_days: {
    label: '¿Qué días podés entrenar?',
    type: 'multi-select',
    options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  },
  session_duration: {
    label: '¿Cuánto tiempo tenés disponible por entrenamiento (minutos)?',
    type: 'number',
    unit: 'min',
    min: 20,
    max: 180,
  },
  recent_pb: {
    label: 'Mejor marca actual (opcional)',
    type: 'pbs',
    optional: true,
  },
  injuries: {
    label: '¿Tenés alguna lesión o limitación física?',
    type: 'textarea',
    optional: true,
  },
  terrain: {
    label: '¿Dónde entrenás normalmente?',
    type: 'select',
    options: ['Calle', 'Pista', 'Trail', 'Cinta', 'Mixto'],
  },
  equipment: {
    label: '¿Utilizás reloj GPS?',
    type: 'select',
    options: ['Garmin', 'COROS', 'Polar', 'Suunto', 'Apple Watch', 'Ninguno'],
  },
  intensity: {
    label: '¿Qué nivel de exigencia buscás?',
    type: 'select',
    options: ['Conservador', 'Equilibrado', 'Agresivo'],
  },
};

const GOAL_CONFIG = {
  '5K': { weeks: 8, baseWeeklyKm: 25, longRunMax: 10, label: '5K' },
  '10K': { weeks: 10, baseWeeklyKm: 35, longRunMax: 16, label: '10K' },
  '15K': { weeks: 10, baseWeeklyKm: 40, longRunMax: 18, label: '15K' },
  '21K': { weeks: 12, baseWeeklyKm: 45, longRunMax: 21, label: '21K' },
  '42K': { weeks: 16, baseWeeklyKm: 55, longRunMax: 35, label: '42K' },
  'Trail Running': { weeks: 12, baseWeeklyKm: 40, longRunMax: 25, label: 'Trail' },
  'Mejorar estado físico': { weeks: 6, baseWeeklyKm: 20, longRunMax: 8, label: 'Fitness' },
};

const LEVEL_MAP = {
  Principiante: 'beginner',
  Intermedio: 'intermediate',
  Avanzado: 'advanced',
};

const INTENSITY_MAP = {
  Conservador: { volumeFactor: 0.8, progressionFactor: 0.05, intensityFactor: 0.8 },
  Equilibrado: { volumeFactor: 1.0, progressionFactor: 0.1, intensityFactor: 1.0 },
  Agresivo: { volumeFactor: 1.2, progressionFactor: 0.15, intensityFactor: 1.2 },
};

const DAY_MAP = {
  Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 0,
};

const SESSION_TYPES = ['easy', 'tempo', 'threshold', 'intervals', 'long_run', 'recovery', 'rest'];
const LEVEL_INTENSITY = {
  beginner: { easy: 0.5, tempo: 0.15, threshold: 0.05, intervals: 0, long_run: 0.2, recovery: 0.1, rest: 0 },
  intermediate: { easy: 0.3, tempo: 0.2, threshold: 0.15, intervals: 0.1, long_run: 0.15, recovery: 0.1, rest: 0 },
  advanced: { easy: 0.2, tempo: 0.2, threshold: 0.15, intervals: 0.15, long_run: 0.2, recovery: 0.1, rest: 0 },
};

export class TrainingWizardService {
  constructor() {
    this.sessionRepository = new TrainingWizardSessionRepository();
    this.answerRepository = new TrainingWizardAnswerRepository();
    this.planRepository = new TrainingPlanRepository();
    this.weekRepository = new TrainingPlanWeekRepository();
    this.sessionRepositoryPlan = new TrainingPlanSessionRepository();
  }

  async startSession(userId) {
    const active = await this.sessionRepository.findActiveByUserId(userId);
    if (active) {
      const answers = await this.answerRepository.findBySessionId(active.id);
      return {
        session: active,
        answers,
        current_question: this._buildQuestion(active.current_step),
        progress: { current: active.current_step, total: active.total_steps },
      };
    }

    const session = await this.sessionRepository.create({
      user_id: userId,
      status: 'in_progress',
      current_step: 0,
      total_steps: QUESTIONS.length,
    });

    return {
      session,
      answers: [],
      current_question: this._buildQuestion(0),
      progress: { current: 0, total: QUESTIONS.length },
    };
  }

  async answerQuestion(sessionId, userId, questionKey, answer) {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (session.user_id !== userId) {
      const err = new Error('No autorizado');
      err.status = 403;
      throw err;
    }
    if (session.status !== 'in_progress') {
      const err = new Error('La sesión ya fue completada');
      err.status = 400;
      throw err;
    }

    const questionDef = QUESTIONS.find((q) => q.key === questionKey);
    if (!questionDef) {
      const err = new Error(`Pregunta "${questionKey}" no válida`);
      err.status = 400;
      throw err;
    }

    const existing = await this.answerRepository.findBySessionAndKey(sessionId, questionKey);
    if (existing) {
      await this.answerRepository.delete(existing.id);
    }

    await this.answerRepository.create({
      session_id: sessionId,
      question_key: questionKey,
      question_label: questionDef.label,
      answer,
    });

    const nextStep = questionDef.step + 1;
    const isLast = nextStep >= QUESTIONS.length;

    await this.sessionRepository.updateStep(sessionId, isLast ? questionDef.step : nextStep);

    if (!isLast) {
      const nextQuestion = this._buildQuestion(nextStep);
      return {
        completed: false,
        current_question: nextQuestion,
        progress: { current: nextStep, total: QUESTIONS.length },
      };
    }

    await this.sessionRepository.complete(sessionId);
    return {
      completed: true,
      message: 'Todas las preguntas respondidas. Ya podés generar tu plan personalizado.',
      progress: { current: QUESTIONS.length, total: QUESTIONS.length },
    };
  }

  async getCurrentSession(userId) {
    const session = await this.sessionRepository.findActiveByUserId(userId);
    if (!session) {
      const err = new Error('No hay una sesión activa del Training Wizard');
      err.status = 404;
      throw err;
    }

    const answers = await this.answerRepository.findBySessionId(session.id);

    return {
      session,
      answers,
      current_question: this._buildQuestion(session.current_step),
      progress: { current: session.current_step, total: session.total_steps },
    };
  }

  async finishSession(sessionId, userId) {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (session.user_id !== userId) {
      const err = new Error('No autorizado');
      err.status = 403;
      throw err;
    }

    await this.sessionRepository.cancel(sessionId);
    return { message: 'Sesión cancelada' };
  }

  async generatePlan(sessionId, userId) {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (session.user_id !== userId) {
      const err = new Error('No autorizado');
      err.status = 403;
      throw err;
    }

    const answers = await this.answerRepository.findBySessionId(sessionId);
    const answersMap = {};
    for (const a of answers) {
      answersMap[a.question_key] = a.answer;
    }

    const goal = answersMap.goal;
    const goalConfig = GOAL_CONFIG[goal];
    if (!goalConfig) {
      const err = new Error(`Objetivo "${goal}" no soportado`);
      err.status = 400;
      throw err;
    }

    const levelStr = answersMap.level || 'Intermedio';
    const level = LEVEL_MAP[levelStr] || 'intermediate';
    const intensityStr = answersMap.intensity || 'Equilibrado';
    const intensity = INTENSITY_MAP[intensityStr] || INTENSITY_MAP.Equilibrado;
    const frequency = parseInt(answersMap.frequency, 10) || 3;
    const weeklyVolume = parseFloat(answersMap.weekly_volume) || goalConfig.baseWeeklyKm;
    const sessionDuration = parseInt(answersMap.session_duration, 10) || 60;
    const availableDays = Array.isArray(answersMap.available_days) ? answersMap.available_days : ['Lunes', 'Miércoles', 'Viernes'];
    const terrain = answersMap.terrain || 'Mixto';
    const targetDate = answersMap.target_date ? new Date(answersMap.target_date) : null;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let totalWeeks = goalConfig.weeks;
    if (targetDate) {
      const diffMs = targetDate.getTime() - startDate.getTime();
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks > 3 && diffWeeks < 52) {
        totalWeeks = diffWeeks;
      }
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalWeeks * 7);

    const plan = await this.planRepository.create({
      user_id: userId,
      goal,
      level,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: true,
      week_count: totalWeeks,
      metadata: {
        source: 'training_wizard',
        session_id: sessionId,
        intensity: intensityStr,
        frequency,
        weekly_volume: weeklyVolume,
        terrain,
        target_time: answersMap.target_time || null,
        injuries: answersMap.injuries || null,
        equipment: answersMap.equipment || null,
      },
    });

    const dayNumbers = availableDays.map((d) => DAY_MAP[d] !== undefined ? DAY_MAP[d] : null).filter((d) => d !== null);
    const weeklyKmStart = Math.min(weeklyVolume * intensity.volumeFactor, goalConfig.baseWeeklyKm * intensity.volumeFactor);
    const peakKm = Math.min(goalConfig.baseWeeklyKm * 1.3 * intensity.volumeFactor, goalConfig.longRunMax * frequency * 0.4);
    const progression = peakKm - weeklyKmStart;
    const weeklyIncrease = progression / totalWeeks;

    const intensityPattern = LEVEL_INTENSITY[level] || LEVEL_INTENSITY.intermediate;

    const taperingWeeks = goal === '42K' ? 3 : goal === '21K' ? 2 : 1;
    const deloadEvery = 4;

    for (let w = 0; w < totalWeeks; w++) {
      const weekNumber = w + 1;
      const isTaperWeek = weekNumber > totalWeeks - taperingWeeks;
      const isDeloadWeek = !isTaperWeek && (weekNumber % deloadEvery === 0);
      const weekProgression = isTaperWeek ? -0.3 : isDeloadWeek ? -0.2 : 1;
      const weekKm = Math.max(weeklyKmStart + weeklyIncrease * w * weekProgression, 10);
      const weekKmRounded = Math.round(weekKm * 10) / 10;

      const week = await this.weekRepository.create({
        plan_id: plan.id,
        week_number: weekNumber,
        total_distance: weekKmRounded,
        total_duration: Math.round(weekKmRounded * (sessionDuration / (weekKmRounded / Math.max(frequency, 1)))),
        description: isTaperWeek ? 'Semana de tapering - reducir volumen' : isDeloadWeek ? 'Semana de descarga - recuperación activa' : `Semana ${weekNumber} - ${Math.round(weekProgression * 100)}% intensidad`,
      });

      const sessionsForWeek = isTaperWeek ? Math.max(Math.floor(frequency * 0.6), 2) : isDeloadWeek ? Math.max(Math.floor(frequency * 0.7), 2) : frequency;

      const usedDays = [];
      for (let s = 0; s < sessionsForWeek; s++) {
        const dayIdx = s < dayNumbers.length ? s : s % dayNumbers.length;
        const dayOfWeek = dayNumbers[dayIdx];
        usedDays.push(dayOfWeek);

        if (dayOfWeek === undefined) continue;

        const sessionTypes = Object.keys(intensityPattern);
        const sessionProbs = Object.values(intensityPattern);
        const rand = Math.random();
        let cumProb = 0;
        let sessionType = 'easy';
        for (let st = 0; st < sessionTypes.length; st++) {
          cumProb += sessionProbs[st];
          if (rand <= cumProb) {
            sessionType = sessionTypes[st];
            break;
          }
        }

        if (sessionType === 'rest') continue;

        const sessionDistance = weekKmRounded / sessionsForWeek * (0.7 + Math.random() * 0.6);
        const isLongRun = sessionType === 'long_run' || (s === sessionsForWeek - 1 && !isDeloadWeek && !isTaperWeek);
        const finalType = isLongRun ? 'long_run' : sessionType;
        const finalDistance = isLongRun ? Math.min(sessionDistance * 1.5, goalConfig.longRunMax) : sessionDistance;

        const paceMin = this._calculatePace(finalType, level, goal, intensity.intensityFactor);

        await this.sessionRepositoryPlan.create({
          week_id: week.id,
          day_of_week: dayOfWeek,
          session_type: finalType,
          description: this._sessionDescription(finalType, level, intensityStr),
          distance_goal: Math.round(finalDistance * 100) / 100,
          duration_goal: Math.round(finalDistance * paceMin * 60 / (isLongRun ? 1 : 1)),
          pace_goal_min: Math.max(paceMin - 10, 240),
          pace_goal_max: paceMin + 15,
        });
      }

      const restDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !usedDays.includes(d));
      for (const restDay of restDays) {
        await this.sessionRepositoryPlan.create({
          week_id: week.id,
          day_of_week: restDay,
          session_type: 'rest',
          description: 'Descanso',
          distance_goal: 0,
          duration_goal: 0,
        });
      }
    }

    const planWithDetails = await this.planRepository.findNonDeletedById(plan.id);
    const weeks = await this.weekRepository.findByPlanId(plan.id);
    const allSessions = [];
    for (const w of weeks) {
      const sessions = await this.sessionRepositoryPlan.findByWeekId(w.id);
      allSessions.push(...sessions.map((s) => ({ ...s, week: w.week_number })));
    }

    const explanation = this._generateExplanation(goal, totalWeeks, frequency, levelStr, answersMap.target_time, intensityStr);

    return {
      plan: planWithDetails,
      weeks,
      sessions: allSessions,
      explanation,
    };
  }

  _buildQuestion(step) {
    const q = QUESTIONS[step];
    if (!q) return null;
    const config = QUESTION_CONFIG[q.key];
    return {
      key: q.key,
      label: config.label,
      type: config.type,
      options: config.options || null,
      placeholder: config.placeholder || null,
      unit: config.unit || null,
      min: config.min || null,
      max: config.max || null,
      optional: config.optional || false,
      step: q.step,
    };
  }

  _calculatePace(sessionType, level, goal, intensityFactor) {
    const basePaces = {
      '5K': { easy: 330, tempo: 280, threshold: 260, intervals: 240, long_run: 320, recovery: 360 },
      '10K': { easy: 345, tempo: 300, threshold: 275, intervals: 255, long_run: 335, recovery: 375 },
      '15K': { easy: 360, tempo: 315, threshold: 290, intervals: 270, long_run: 350, recovery: 390 },
      '21K': { easy: 375, tempo: 330, threshold: 305, intervals: 285, long_run: 365, recovery: 405 },
      '42K': { easy: 405, tempo: 360, threshold: 335, intervals: 315, long_run: 395, recovery: 435 },
      'Trail Running': { easy: 420, tempo: 375, threshold: 350, intervals: 330, long_run: 410, recovery: 450 },
      'Mejorar estado físico': { easy: 360, tempo: 315, threshold: 290, intervals: 270, long_run: 350, recovery: 390 },
    };

    const goalPaces = basePaces[goal] || basePaces['10K'];
    const levelFactor = level === 'beginner' ? 1.15 : level === 'advanced' ? 0.9 : 1.0;
    const pace = (goalPaces[sessionType] || goalPaces.easy) * levelFactor / intensityFactor;
    return Math.round(pace);
  }

  _sessionDescription(type, level, intensity) {
    const descs = {
      easy: 'Carrera suave. Ritmo conversacional. Mantener zona 2 de frecuencia cardíaca.',
      tempo: 'Ritmo cómodamente rápido. Sensación de esfuerzo 7/10. Mantener ritmo constante.',
      threshold: 'Ritmo de umbral. Esfuerzo sostenido 8/10. Justo por debajo del máximo sostenible.',
      intervals: 'Series de alta intensidad. Alternar esfuerzo máximo con recuperación activa.',
      long_run: 'Fondo semanal. Aumentar resistencia. Ritmo suave, enfoque en acumular tiempo de piernas.',
      recovery: 'Recuperación activa. Muy suave. Trote ligero o caminata.',
      rest: 'Descanso completo. Importante para la recuperación muscular.',
    };
    return descs[type] || 'Entrenamiento';
  }

  _generateExplanation(goal, weeks, frequency, level, targetTime, intensity) {
    const goalLabels = { '5K': '5K', '10K': '10K', '15K': '15K', '21K': '21K', '42K': 'maratón', 'Trail Running': 'trail running', 'Mejorar estado físico': 'mejorar el estado físico' };
    const levelLabels = { Principiante: 'principiante', Intermedio: 'intermedio', Avanzado: 'avanzado' };
    const targetStr = targetTime ? ` en ${targetTime}` : '';
    return `Se creó un plan de ${weeks} semanas para ${goalLabels[goal] || goal}${targetStr}. El plan está diseñado para un nivel ${levelLabels[level] || level} con enfoque ${intensity.toLowerCase()}. Incluye ${frequency} días de entrenamiento por semana, con una progresión gradual de volumen y sesiones específicas para alcanzar tu objetivo.`;
  }
}

export default TrainingWizardService;
