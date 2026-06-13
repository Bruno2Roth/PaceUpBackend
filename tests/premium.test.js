import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import MetricsService from '../src/application/services/MetricsService.js';
import AiCoachService from '../src/application/services/AiCoachService.js';
import TrainingPlanService from '../src/application/services/TrainingPlanService.js';
import RouteService from '../src/application/services/RouteService.js';
import HeatmapService from '../src/application/services/HeatmapService.js';
import PremiumService from '../src/application/services/PremiumService.js';
import SubscriptionRepository from '../src/data/repositories/SubscriptionRepository.js';

describe('MetricsService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findLatestByUserId: jest.fn(),
      getHistoryByDateRange: jest.fn(),
      getActivitiesForLoad: jest.fn(),
      getUserAge: jest.fn(),
      create: jest.fn(),
    };
    service = new MetricsService();
    service.metricsRepository = mockRepo;
  });

  it('getMetrics returns metrics from repository', async () => {
    const mockMetrics = { vo2_max: 45, training_load: 80 };
    mockRepo.findLatestByUserId.mockResolvedValue(mockMetrics);

    const result = await service.getMetrics(1);
    expect(result).toEqual(mockMetrics);
    expect(mockRepo.findLatestByUserId).toHaveBeenCalledWith(1);
  });

  it('getMetrics returns empty object when no metrics', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue(null);

    const result = await service.getMetrics(1);
    expect(result).toEqual({});
  });

  it('getMetricsHistory returns history', async () => {
    const mockHistory = [{ date: '2026-01-01', vo2_max: 45 }];
    mockRepo.getHistoryByDateRange.mockResolvedValue(mockHistory);

    const result = await service.getMetricsHistory(1, 30);
    expect(result).toEqual(mockHistory);
  });

  it('getTrainingLoad returns breakdown', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue({ acute_load: 80, chronic_load: 100 });

    const result = await service.getTrainingLoad(1);
    expect(result.acute_load).toBe(80);
    expect(result.ratio).toBe(0.8);
  });

  it('getTrainingLoad returns null ratio when chronic is zero', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue({ acute_load: 0, chronic_load: 0 });

    const result = await service.getTrainingLoad(1);
    expect(result.ratio).toBeNull();
  });

  it('getRecovery returns ready when score >= 70', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue({ recovery_score: 75, fatigue_score: 25 });

    const result = await service.getRecovery(1);
    expect(result.status).toBe('ready');
  });

  it('getRecovery defaults when no metrics', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue(null);

    const result = await service.getRecovery(1);
    expect(result.recovery_score).toBe(100);
  });

  it('getFitness returns data', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue({ fitness_score: 75, vo2_max: 45 });

    const result = await service.getFitness(1);
    expect(result.fitness_score).toBe(75);
    expect(result.vo2_max).toBe(45);
  });

  it('getFitness defaults when no metrics', async () => {
    mockRepo.findLatestByUserId.mockResolvedValue(null);

    const result = await service.getFitness(1);
    expect(result.fitness_score).toBe(0);
  });

  it('calculateMetrics computes and stores metrics', async () => {
    const activity = { distance_m: 5000, duration_seconds: 1800, elevation_gain_m: 50, pace_per_km: 360, start_time: new Date() };
    mockRepo.getActivitiesForLoad.mockResolvedValueOnce([activity]).mockResolvedValueOnce([activity]);
    mockRepo.getUserAge.mockResolvedValue({ date_of_birth: '1990-01-01' });
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.calculateMetrics(1);
    expect(result.vo2_max).toBeDefined();
    expect(result.training_load).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('calculateMetrics handles no activities', async () => {
    mockRepo.getActivitiesForLoad.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockRepo.getUserAge.mockResolvedValue({});
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.calculateMetrics(1);
    expect(result.vo2_max).toBeNull();
  });
});

describe('AiCoachService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      getWeeklyActivities: jest.fn(),
      getStreakData: jest.fn(),
      getHistorySummary: jest.fn(),
      getPersonalBests: jest.fn(),
      create: jest.fn(),
    };
    service = new AiCoachService();
    service.aiCoachRepository = mockRepo;
  });

  it('getWeeklyReport generates from activities', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue([
      { distance_m: 5000, duration_seconds: 1800, elevation_gain_m: 50, pace_per_km: 360, activity_type: 'running', start_time: new Date() },
    ]);
    mockRepo.getStreakData.mockResolvedValue([new Date()]);
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.getWeeklyReport(1);
    expect(result.summary.activity_count).toBe(1);
  });

  it('getWeeklyReport handles no activities', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue([]);
    mockRepo.getStreakData.mockResolvedValue([]);
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.getWeeklyReport(1);
    expect(result.summary.activity_count).toBe(0);
  });

  it('getRecommendations returns tips', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue([]);
    mockRepo.getStreakData.mockResolvedValue([]);
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.getRecommendations(1);
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it('getRecommendations detects declining trend', async () => {
    mockRepo.getWeeklyActivities
      .mockResolvedValueOnce([{ distance_m: 3000, duration_seconds: 1200, elevation_gain_m: 20, pace_per_km: 360, activity_type: 'running', start_time: new Date() }])
      .mockResolvedValueOnce([{ distance_m: 15000, duration_seconds: 5400, elevation_gain_m: 150, pace_per_km: 340, activity_type: 'running', start_time: new Date(Date.now() - 10 * 86400000) }]);
    mockRepo.getStreakData.mockResolvedValue([new Date()]);
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.getRecommendations(1);
    expect(result.tips.find(t => t.type === 'volume')).toBeDefined();
  });

  it('getInsights returns insights', async () => {
    mockRepo.getHistorySummary
      .mockResolvedValueOnce({ total_activities: 100, total_distance: 500000, active_days: 200 })
      .mockResolvedValueOnce({ total_activities: 10, total_distance: 50000, active_days: 15 });
    mockRepo.getPersonalBests.mockResolvedValue({ '5K': { time_seconds: 1200, achieved_at: new Date().toISOString() } });
    mockRepo.getStreakData.mockResolvedValue(Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 86400000)));

    const result = await service.getInsights(1);
    expect(result.insights).toBeDefined();
    expect(result.totals).toBeDefined();
  });

  it('analyze returns complete analysis', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue([]);
    mockRepo.getStreakData.mockResolvedValue([]);
    mockRepo.getHistorySummary
      .mockResolvedValueOnce({ total_activities: 0, total_distance: 0, active_days: 0 })
      .mockResolvedValueOnce({ total_activities: 0, total_distance: 0, active_days: 0 });
    mockRepo.getPersonalBests.mockResolvedValue({});
    mockRepo.create.mockImplementation(data => ({ id: 1, ...data }));

    const result = await service.analyze(1);
    expect(result.weeklyReport).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.fatigue_detection).toBeDefined();
  });

  it('detectFatigue returns low when normal', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue([{ distance_m: 5000, duration_seconds: 1800, start_time: new Date() }]);
    const result = await service.detectFatigue(1);
    expect(result.fatigue_level).toBe('low');
  });

  it('detectFatigue returns high when excessive', async () => {
    mockRepo.getWeeklyActivities.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({
      distance_m: 15000, duration_seconds: 5400, start_time: new Date(Date.now() - i * 86400000),
    })));
    const result = await service.detectFatigue(1);
    expect(result.fatigue_level).toBe('high');
  });
});

describe('TrainingPlanService', () => {
  let service;
  let mockPlan, mockWeek, mockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlan = { findActiveByUserId: jest.fn(), findNonDeletedById: jest.fn(), create: jest.fn(), update: jest.fn(), softDelete: jest.fn() };
    mockWeek = { findByPlanId: jest.fn(), create: jest.fn() };
    mockSession = { findByWeekId: jest.fn(), findIncompleteByPlan: jest.fn(), create: jest.fn(), update: jest.fn(), getCompletionRate: jest.fn() };
    service = new TrainingPlanService();
    service.planRepository = mockPlan;
    service.weekRepository = mockWeek;
    service.sessionRepository = mockSession;
  });

  it('generatePlan creates plan with sessions', async () => {
    mockPlan.findActiveByUserId.mockResolvedValue(null);
    mockPlan.create.mockResolvedValue({ id: 1, goal: '5K', week_count: 8 });
    mockWeek.create.mockResolvedValue({ id: 1 });
    mockSession.create.mockResolvedValue({ id: 1 });
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1 });
    mockWeek.findByPlanId.mockResolvedValue([{ id: 1, week_number: 1 }]);
    mockSession.findByWeekId.mockResolvedValue([{ id: 1, session_type: 'easy' }]);
    mockSession.getCompletionRate.mockResolvedValue({ total: 7, completed: 0 });

    const result = await service.generatePlan(1, '5K', 'beginner');
    expect(result).toBeDefined();
    expect(mockPlan.create).toHaveBeenCalled();
  });

  it('generatePlan deactivates existing active plan', async () => {
    mockPlan.findActiveByUserId.mockResolvedValue({ id: 1, is_active: true });
    mockPlan.create.mockResolvedValue({ id: 2, goal: '10K', week_count: 10 });
    mockWeek.create.mockResolvedValue({ id: 1 });
    mockSession.create.mockResolvedValue({ id: 1 });
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 2 });
    mockWeek.findByPlanId.mockResolvedValue([]);
    mockSession.getCompletionRate.mockResolvedValue({ total: 0, completed: 0 });

    await service.generatePlan(1, '10K', 'intermediate');
    expect(mockPlan.update).toHaveBeenCalledWith(1, { is_active: false });
  });

  it('generatePlan throws for invalid goal', async () => {
    await expect(service.generatePlan(1, '100K', 'beginner')).rejects.toThrow('Invalid goal');
  });

  it('getCurrentPlan returns plan with details', async () => {
    mockPlan.findActiveByUserId.mockResolvedValue({ id: 1, goal: '5K' });
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1 });
    mockWeek.findByPlanId.mockResolvedValue([{ id: 1, week_number: 1 }]);
    mockSession.findByWeekId.mockResolvedValue([]);
    mockSession.getCompletionRate.mockResolvedValue({ total: 7, completed: 3 });
    expect(await service.getCurrentPlan(1)).toBeDefined();
  });

  it('getCurrentPlan returns null when no active plan', async () => {
    mockPlan.findActiveByUserId.mockResolvedValue(null);
    expect(await service.getCurrentPlan(1)).toBeNull();
  });

  it('getPlanById returns plan', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1 });
    mockWeek.findByPlanId.mockResolvedValue([]);
    mockSession.getCompletionRate.mockResolvedValue({ total: 0, completed: 0 });
    expect(await service.getPlanById(1)).toBeDefined();
  });

  it('getPlanById throws 404', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue(null);
    await expect(service.getPlanById(999)).rejects.toThrow('Plan not found');
  });

  it('updatePlan updates when authorized', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    mockPlan.update.mockResolvedValue({ id: 1 });
    mockWeek.findByPlanId.mockResolvedValue([]);
    mockSession.getCompletionRate.mockResolvedValue({ total: 0, completed: 0 });
    expect(await service.updatePlan(1, 1, { goal: '10K' })).toBeDefined();
  });

  it('updatePlan throws 403 when unauthorized', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
    await expect(service.updatePlan(1, 1, {})).rejects.toThrow('Unauthorized');
  });

  it('deletePlan soft deletes', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    expect(await service.deletePlan(1, 1)).toEqual({ message: 'Plan deleted' });
  });

  it('pausePlan pauses', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    await service.pausePlan(1, 1);
    expect(mockPlan.update).toHaveBeenCalledWith(1, { is_paused: true });
  });

  it('resumePlan resumes', async () => {
    mockPlan.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    await service.resumePlan(1, 1);
    expect(mockPlan.update).toHaveBeenCalledWith(1, { is_paused: false });
  });

  it('completeSession marks completed', async () => {
    mockSession.update.mockResolvedValue({ id: 1, is_completed: true, completed_distance: 5000 });
    const result = await service.completeSession(1, 1, { distance_m: 5000, duration_seconds: 1800 });
    expect(result.is_completed).toBe(true);
  });
});

describe('RouteService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = { create: jest.fn(), findNonDeletedById: jest.fn(), findByUserId: jest.fn(), findPublic: jest.fn(), findPopular: jest.fn(), findNearby: jest.fn(), findFavorites: jest.fn(), update: jest.fn(), softDelete: jest.fn() };
    service = new RouteService();
    service.routeRepository = mockRepo;
  });

  it('createRoute with default name', async () => {
    mockRepo.create.mockImplementation(d => ({ id: 1, ...d }));
    expect((await service.createRoute(1, { distance_m: 5000 })).name).toBe('Sin nombre');
  });

  it('createRoute with custom name', async () => {
    mockRepo.create.mockImplementation(d => ({ id: 1, ...d }));
    expect((await service.createRoute(1, { name: 'MR', is_public: false })).name).toBe('MR');
  });

  it('getRoutes returns public', async () => {
    mockRepo.findPublic.mockResolvedValue([{ id: 1 }]);
    expect(await service.getRoutes(1, { public: true })).toHaveLength(1);
  });

  it('getRoutes returns user routes', async () => {
    mockRepo.findByUserId.mockResolvedValue([{ id: 1 }]);
    await service.getRoutes(1, {});
    expect(mockRepo.findByUserId).toHaveBeenCalledWith(1, 20, 0);
  });

  it('getRouteById returns route', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue({ id: 1, name: 'Test' });
    expect((await service.getRouteById(1)).name).toBe('Test');
  });

  it('getRouteById throws 404', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue(null);
    await expect(service.getRouteById(999)).rejects.toThrow('Route not found');
  });

  it('updateRoute when authorized', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    mockRepo.update.mockImplementation((id, d) => ({ id, ...d }));
    expect(await service.updateRoute(1, 1, { name: 'U' })).toBeDefined();
  });

  it('updateRoute throws 403', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 2 });
    await expect(service.updateRoute(1, 1, {})).rejects.toThrow('Unauthorized');
  });

  it('deleteRoute when authorized', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1 });
    expect((await service.deleteRoute(1, 1)).message).toBe('Route deleted');
  });

  it('getPopularRoutes', async () => {
    mockRepo.findPopular.mockResolvedValue([{ id: 1 }]);
    expect(await service.getPopularRoutes(10)).toHaveLength(1);
  });

  it('getNearbyRoutes', async () => {
    mockRepo.findNearby.mockResolvedValue([{ id: 1 }]);
    await service.getNearbyRoutes(40.4168, -3.7038, 10, 20);
    expect(mockRepo.findNearby).toHaveBeenCalledWith(40.4168, -3.7038, 10, 20);
  });

  it('getFavoriteRoutes', async () => {
    mockRepo.findFavorites.mockResolvedValue([{ id: 1 }]);
    expect(await service.getFavoriteRoutes(1)).toHaveLength(1);
  });

  it('toggleFavorite toggles', async () => {
    mockRepo.findNonDeletedById.mockResolvedValue({ id: 1, user_id: 1, is_favorite: false });
    await service.toggleFavorite(1, 1);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { is_favorite: true });
  });
});

describe('HeatmapService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = { findByUserZoom: jest.fn(), findByClubZoom: jest.fn(), findGlobalZoom: jest.fn(), getUserGPSCoordinates: jest.fn(), clearUserTiles: jest.fn(), upsertTile: jest.fn() };
    service = new HeatmapService();
    service.heatmapRepository = mockRepo;
  });

  it('getPersonalHeatmap returns tiles', async () => {
    mockRepo.findByUserZoom.mockResolvedValue([{ x_coord: 100, y_coord: 200, intensity: 5 }]);
    const result = await service.getPersonalHeatmap(1);
    expect(result.type).toBe('personal');
    expect(result.tiles[0]).toEqual({ x: 100, y: 200, intensity: 5 });
  });

  it('getPersonalHeatmap empty when no data', async () => {
    mockRepo.findByUserZoom.mockResolvedValue([]);
    expect((await service.getPersonalHeatmap(1)).tiles).toEqual([]);
  });

  it('getClubHeatmap', async () => {
    mockRepo.findByClubZoom.mockResolvedValue([{ x_coord: 50, y_coord: 60, intensity: 10 }]);
    expect((await service.getClubHeatmap(1)).type).toBe('club');
  });

  it('getGlobalHeatmap', async () => {
    mockRepo.findGlobalZoom.mockResolvedValue([{ x_coord: 300, y_coord: 400, intensity: 8 }]);
    expect((await service.getGlobalHeatmap()).tiles).toHaveLength(1);
  });

  it('generatePersonalHeatmap from GPS data', async () => {
    mockRepo.getUserGPSCoordinates.mockResolvedValue([{ gps_data: JSON.stringify([{ lat: 40.4168, lng: -3.7038 }]) }]);
    mockRepo.upsertTile.mockResolvedValue({});
    expect((await service.generatePersonalHeatmap(1)).message).toBe('Heatmap generated');
  });

  it('generatePersonalHeatmap handles null GPS', async () => {
    mockRepo.getUserGPSCoordinates.mockResolvedValue([{ gps_data: null }, { gps_data: '[]' }]);
    expect((await service.generatePersonalHeatmap(1)).message).toBe('Heatmap generated');
  });

  it('latLngToTile at zoom 14', () => {
    const r = service.latLngToTile(40.4168, -3.7038, 14);
    expect(r.x).toBeGreaterThan(0);
    expect(r.y).toBeGreaterThan(0);
  });

  it('latLngToTile at zoom 0', () => {
    expect(service.latLngToTile(0, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('PremiumService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = { findActiveByUserId: jest.fn(), findByUserId: jest.fn() };
    service = new PremiumService();
    service.subscriptionRepository = mockRepo;
  });

  it('isPremium true when active', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue({ id: 1, status: 'active' });
    expect(await service.isPremium(1)).toBe(true);
  });

  it('isPremium false when none', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue(null);
    expect(await service.isPremium(1)).toBe(false);
  });

  it('hasFeature true when in plan', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue({ features: ['metrics'] });
    expect(await service.hasFeature(1, 'metrics')).toBe(true);
  });

  it('hasFeature false when not in plan', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue({ features: ['metrics'] });
    expect(await service.hasFeature(1, 'ai_coach')).toBe(false);
  });

  it('requirePremium returns subscription', async () => {
    const sub = { id: 1, status: 'active', features: ['metrics'] };
    mockRepo.findActiveByUserId.mockResolvedValue(sub);
    expect(await service.requirePremium(1, 'metrics')).toEqual(sub);
  });

  it('requirePremium throws when not premium', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue(null);
    await expect(service.requirePremium(1)).rejects.toThrow('Premium subscription required');
  });

  it('requirePremium throws when feature missing', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue({ features: ['metrics'] });
    await expect(service.requirePremium(1, 'ai_coach')).rejects.toThrow('requires premium subscription');
  });

  it('getUserSubscription when active', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue({ plan_id: 1, plan_name: 'P', plan_code: 'pm', status: 'active', current_period_end: '2026-07-01' });
    expect((await service.getUserSubscription(1)).is_premium).toBe(true);
  });

  it('getUserSubscription when none', async () => {
    mockRepo.findActiveByUserId.mockResolvedValue(null);
    expect((await service.getUserSubscription(1)).is_premium).toBe(false);
  });
});

describe('SubscriptionRepository', () => {
  let repo;
  let mockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = { query: jest.fn() };
    repo = new SubscriptionRepository();
    repo.pool = mockPool;
  });

  it('findAllActiveUserIds returns user IDs', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ user_id: 1 }, { user_id: 2 }] });
    expect(await repo.findAllActiveUserIds()).toEqual([1, 2]);
  });

  it('findAllActiveUserIds empty when none', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    expect(await repo.findAllActiveUserIds()).toEqual([]);
  });
});
