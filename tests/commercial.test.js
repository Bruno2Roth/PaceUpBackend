import { jest } from '@jest/globals';
import SubscriptionService from '../src/application/services/SubscriptionService.js';
import ReferralService from '../src/application/services/ReferralService.js';
import CouponService from '../src/application/services/CouponService.js';
import BillingService from '../src/application/services/BillingService.js';
import CommercialAnalyticsService from '../src/application/services/CommercialAnalyticsService.js';
import RetentionService from '../src/application/services/RetentionService.js';

describe('SubscriptionService', () => {
  let service;
  let mockSubRepo;
  let mockPlanRepo;
  let mockHistoryRepo;
  let mockInvoiceRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockSubRepo = {
      findActiveByUserId: jest.fn(),
      findByUserId: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findAllActiveUserIds: jest.fn(),
    };
    mockPlanRepo = { findActive: jest.fn(), findByCode: jest.fn() };
    mockHistoryRepo = { create: jest.fn(), findByUserId: jest.fn() };
    mockInvoiceRepo = { create: jest.fn(), findByUserId: jest.fn(), findById: jest.fn(), findMany: jest.fn(), revenueBetween: jest.fn(), countByStatus: jest.fn() };
    mockUserRepo = { findNonDeletedById: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() };

    service = new SubscriptionService();
    service.subscriptionRepository = mockSubRepo;
    service.planRepository = mockPlanRepo;
    service.historyRepository = mockHistoryRepo;
    service.invoiceRepository = mockInvoiceRepo;
    service.userRepository = mockUserRepo;
    service.notificationService = { createNotification: jest.fn() };
    service.achievementService = { evaluateAndAward: jest.fn() };
    service.xpService = { awardXp: jest.fn() };
  });

  describe('getPlans', () => {
    it('should return DB plans when available', async () => {
      const dbPlans = [{ id: 'p1', name: 'Premium', code: 'premium_monthly' }];
      mockPlanRepo.findActive.mockResolvedValue(dbPlans);
      const plans = await service.getPlans();
      expect(plans).toEqual(dbPlans);
    });

    it('should return fallback plans when DB empty', async () => {
      mockPlanRepo.findActive.mockResolvedValue([]);
      const plans = await service.getPlans();
      expect(plans.length).toBeGreaterThanOrEqual(3);
      expect(plans[0].code).toBe('free');
    });
  });

  describe('getUserSubscription', () => {
    it('should return free plan when no active sub', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue(null);
      const result = await service.getUserSubscription('user1');
      expect(result.is_premium).toBe(false);
      expect(result.plan).toBe('free');
    });

    it('should return premium status when active sub exists', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue({
        plan_id: 'p1', plan_name: 'Premium', plan_code: 'premium_monthly',
        status: 'active', current_period_start: new Date(), current_period_end: new Date(),
        cancel_at_period_end: false, features: ['metrics', 'ai_coach'],
      });
      const result = await service.getUserSubscription('user1');
      expect(result.is_premium).toBe(true);
      expect(result.plan.code).toBe('premium_monthly');
    });
  });

  describe('subscribe', () => {
    it('should throw on invalid plan', async () => {
      mockPlanRepo.findByCode.mockResolvedValue(null);
      await expect(service.subscribe('u1', 'invalid_plan')).rejects.toThrow('Invalid plan code');
    });

    it('should create subscription for valid plan', async () => {
      mockPlanRepo.findByCode.mockResolvedValue({ id: 'p1', name: 'Premium', code: 'premium_monthly', price_monthly: 9.99, currency: 'USD' });
      mockSubRepo.findActiveByUserId.mockResolvedValue(null);
      mockSubRepo.create.mockResolvedValue({ id: 's1', plan_id: 'p1', status: 'active' });
      mockHistoryRepo.create.mockResolvedValue({});
      mockInvoiceRepo.create.mockResolvedValue({});

      const result = await service.subscribe('u1', 'premium_monthly', 'stripe');
      expect(result.id).toBe('s1');
      expect(mockSubRepo.create).toHaveBeenCalled();
      expect(mockHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'subscribed' })
      );
    });
  });

  describe('startTrial', () => {
    it('should throw if user already has active sub', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue({ id: 's1' });
      await expect(service.startTrial('u1', 'premium_monthly')).rejects.toThrow('already has an active subscription');
    });

    it('should throw if user already used trial', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue(null);
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u1', trial_started_at: new Date() });
      await expect(service.startTrial('u1', 'premium_monthly')).rejects.toThrow('Trial already used');
    });

    it('should create trial subscription', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue(null);
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u1', trial_started_at: null });
      mockPlanRepo.findByCode.mockResolvedValue({ id: 'p1', name: 'Premium', code: 'premium_monthly' });
      mockSubRepo.create.mockResolvedValue({ id: 's1', status: 'trial' });
      mockUserRepo.update.mockResolvedValue({});
      mockHistoryRepo.create.mockResolvedValue({});

      const result = await service.startTrial('u1', 'premium_monthly', 7);
      expect(result.status).toBe('trial');
      expect(mockSubRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'trial' })
      );
    });
  });

  describe('cancel', () => {
    it('should throw if no active subscription', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue(null);
      await expect(service.cancel('u1')).rejects.toThrow('No active subscription found');
    });

    it('should cancel subscription', async () => {
      mockSubRepo.findActiveByUserId.mockResolvedValue({ id: 's1', plan_id: 'p1', current_period_end: new Date() });
      mockSubRepo.update.mockResolvedValue({ id: 's1', cancel_at_period_end: true });
      mockHistoryRepo.create.mockResolvedValue({});
      const result = await service.cancel('u1');
      expect(result.cancel_at_period_end).toBe(true);
    });
  });

  describe('reactivate', () => {
    it('should throw if no canceled sub to reactivate', async () => {
      mockSubRepo.findByUserId.mockResolvedValue([]);
      await expect(service.reactivate('u1')).rejects.toThrow('No canceled subscription to reactivate');
    });

    it('should reactivate subscription', async () => {
      mockSubRepo.findByUserId.mockResolvedValue([{ id: 's1', plan_id: 'p1', status: 'active', cancel_at_period_end: true }]);
      mockSubRepo.update.mockResolvedValue({ id: 's1', cancel_at_period_end: false });
      mockHistoryRepo.create.mockResolvedValue({});
      const result = await service.reactivate('u1');
      expect(result.cancel_at_period_end).toBe(false);
    });
  });

  describe('getTrialStatus', () => {
    it('should return not used when no trial', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u1', trial_started_at: null });
      const result = await service.getTrialStatus('u1');
      expect(result.trial_used).toBe(false);
    });
  });
});

const mockXpService = { awardXp: jest.fn() };

describe('ReferralService', () => {
  let service;
  let mockRefRepo;
  let mockUserRepo;
  let mockAchRepo;

  beforeEach(() => {
    mockRefRepo = { findByReferrer: jest.fn(), findByCode: jest.fn(), countByReferrer: jest.fn(), create: jest.fn(), update: jest.fn() };
    mockUserRepo = { findNonDeletedById: jest.fn(), update: jest.fn() };
    mockAchRepo = { hasAchievement: jest.fn(), create: jest.fn() };

    service = new ReferralService();
    service.referralRepository = mockRefRepo;
    service.userRepository = mockUserRepo;
    service.achievementRepository = mockAchRepo;
    service.xpService = mockXpService;
    service.notificationService = { createNotification: jest.fn(), notifyAchievement: jest.fn() };
  });

  describe('getReferralInfo', () => {
    it('should generate code if user has none', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u1', name: 'Runner', referral_code: null });
      mockRefRepo.countByReferrer.mockResolvedValue(0);
      mockRefRepo.findByReferrer.mockResolvedValue([]);
      mockUserRepo.update.mockResolvedValue({});

      const info = await service.getReferralInfo('u1');
      expect(info.referral_code).toBeTruthy();
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should return existing code', async () => {
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u1', name: 'Runner', referral_code: 'runner-abc' });
      mockRefRepo.countByReferrer.mockResolvedValue(2);
      mockRefRepo.findByReferrer.mockResolvedValue([{ id: 'r1', status: 'completed' }]);

      const info = await service.getReferralInfo('u1');
      expect(info.referral_code).toBe('runner-abc');
      expect(info.total_referrals).toBe(2);
    });
  });

  describe('completeReferral', () => {
    it('should award XP and achievement', async () => {
      mockRefRepo.findByCode.mockResolvedValue({ id: 'r1', referrer_id: 'u1', status: 'pending' });
      mockUserRepo.findNonDeletedById.mockResolvedValue({ id: 'u2', referred_by: null });
      mockRefRepo.update.mockResolvedValue({});
      mockAchRepo.hasAchievement.mockResolvedValue(false);
      mockAchRepo.create.mockResolvedValue({ id: 'a1' });

      await service.completeReferral('runner-abc', 'u2');
      expect(mockRefRepo.update).toHaveBeenCalled();
      expect(mockXpService.awardXp).toHaveBeenCalledWith('u1', 'referral_completed', expect.any(Object));
    });
  });
});

describe('CouponService', () => {
  let service;
  let mockCouponRepo;
  let mockRedemptionRepo;

  beforeEach(() => {
    mockCouponRepo = { findValid: jest.fn(), incrementRedemptions: jest.fn(), findAll: jest.fn() };
    mockRedemptionRepo = { countByUserAndCoupon: jest.fn(), create: jest.fn() };

    service = new CouponService();
    service.couponRepository = mockCouponRepo;
    service.redemptionRepository = mockRedemptionRepo;
    service.notificationService = { createNotification: jest.fn() };
  });

  describe('validate', () => {
    it('should return valid for unused coupon', async () => {
      mockCouponRepo.findValid.mockResolvedValue({
        id: 'c1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10,
        max_redemptions: 100, current_redemptions: 5, valid_from: new Date('2020-01-01'),
        valid_until: new Date('2030-01-01'), applies_to_plans: [],
      });
      mockRedemptionRepo.countByUserAndCoupon.mockResolvedValue(0);

      const result = await service.validate('SAVE10', 'u1');
      expect(result.valid).toBe(true);
    });

    it('should throw for invalid coupon', async () => {
      mockCouponRepo.findValid.mockResolvedValue(null);
      await expect(service.validate('INVALID', 'u1')).rejects.toThrow('Invalid or expired coupon');
    });

    it('should throw if already redeemed by user', async () => {
      mockCouponRepo.findValid.mockResolvedValue({ id: 'c1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10, max_redemptions: 100, current_redemptions: 5, valid_from: new Date('2020-01-01'), valid_until: new Date('2030-01-01'), applies_to_plans: [] });
      mockRedemptionRepo.countByUserAndCoupon.mockResolvedValue(1);
      await expect(service.validate('SAVE10', 'u1')).rejects.toThrow('already redeemed');
    });
  });

  describe('redeem', () => {
    it('should redeem valid coupon', async () => {
      mockCouponRepo.findValid.mockResolvedValue({ id: 'c1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10, max_redemptions: 100, current_redemptions: 5, valid_from: new Date('2020-01-01'), valid_until: new Date('2030-01-01'), applies_to_plans: [] });
      mockRedemptionRepo.countByUserAndCoupon.mockResolvedValue(0);
      mockCouponRepo.incrementRedemptions.mockResolvedValue({ id: 'c1', current_redemptions: 6 });
      mockRedemptionRepo.create.mockResolvedValue({ id: 'cr1', discount_amount: 10 });

      const result = await service.redeem('SAVE10', 'u1', 's1');
      expect(result.discount.type).toBe('percentage');
      expect(result.redemption.id).toBe('cr1');
    });
  });
});

describe('BillingService', () => {
  let service;
  let mockInvoiceRepo;
  let mockSubRepo;

  beforeEach(() => {
    mockInvoiceRepo = { findMany: jest.fn(), findByUserId: jest.fn(), findById: jest.fn(), revenueBetween: jest.fn(), countByStatus: jest.fn() };
    mockSubRepo = { count: jest.fn(), findAllActiveUserIds: jest.fn(), findMany: jest.fn() };

    service = new BillingService();
    service.invoiceRepository = mockInvoiceRepo;
    service.subscriptionRepository = mockSubRepo;
  });

  describe('getInvoiceById', () => {
    it('should return invoice for owner', async () => {
      mockInvoiceRepo.findById.mockResolvedValue({ id: 'inv1', user_id: 'u1', amount: 9.99 });
      const result = await service.getInvoiceById('inv1', 'u1');
      expect(result.id).toBe('inv1');
    });

    it('should throw for unauthorized user', async () => {
      mockInvoiceRepo.findById.mockResolvedValue({ id: 'inv1', user_id: 'u1', amount: 9.99 });
      await expect(service.getInvoiceById('inv1', 'u2')).rejects.toThrow('Unauthorized');
    });

    it('should throw for missing invoice', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(null);
      await expect(service.getInvoiceById('inv1', 'u1')).rejects.toThrow('Invoice not found');
    });
  });

  describe('getAdminStats', () => {
    it('should return aggregated stats', async () => {
      mockInvoiceRepo.revenueBetween.mockResolvedValue(1000);
      mockSubRepo.count.mockResolvedValue(50);

      const stats = await service.getAdminStats();
      expect(stats.totalRevenue).toBe(1000);
      expect(stats.activeSubscriptions).toBe(50);
    });
  });

  describe('getRevenueMetrics', () => {
    it('should calculate MRR, ARR, ARPU', async () => {
      mockInvoiceRepo.revenueBetween.mockResolvedValue(500);
      mockSubRepo.count
        .mockResolvedValueOnce(50) // active subs
        .mockResolvedValueOnce(10) // canceled
        .mockResolvedValueOnce(5); // conversions

      const metrics = await service.getRevenueMetrics();
      expect(metrics.mrr).toBe(500);
      expect(metrics.arr).toBe(6000);
      expect(metrics.arpu).toBe(10);
    });
  });
});

describe('CommercialAnalyticsService', () => {
  let service;
  let mockSubRepo;
  let mockInvoiceRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockSubRepo = {
      pool: { query: jest.fn() },
      count: jest.fn(),
      findAllActiveUserIds: jest.fn(),
    };
    mockInvoiceRepo = { revenueBetween: jest.fn(), countByStatus: jest.fn() };
    mockUserRepo = { count: jest.fn() };

    service = new CommercialAnalyticsService();
    service.subscriptionRepository = mockSubRepo;
    service.invoiceRepository = mockInvoiceRepo;
    service.userRepository = mockUserRepo;
  });

  describe('getAnalytics', () => {
    it('should return business KPIs', async () => {
      mockUserRepo.count.mockResolvedValue(1000);
      mockSubRepo.count.mockResolvedValue(100);
      mockInvoiceRepo.revenueBetween.mockResolvedValue(999);
      mockSubRepo.pool.query.mockResolvedValue({ rows: [] });

      const analytics = await service.getAnalytics();
      expect(analytics.total_users).toBe(1000);
      expect(analytics.active_subscriptions).toBe(100);
      expect(analytics.mrr).toBe(999);
      expect(analytics.arr).toBe(11988);
    });
  });
});

describe('RetentionService', () => {
  let service;
  let mockUserRepo;
  let mockSubRepo;
  let mockActivityRepo;

  beforeEach(() => {
    mockUserRepo = { findMany: jest.fn(), findNonDeletedById: jest.fn() };
    mockSubRepo = { findAllActiveUserIds: jest.fn(), findMany: jest.fn() };
    mockActivityRepo = {};

    service = new RetentionService();
    service.userRepository = mockUserRepo;
    service.subscriptionRepository = mockSubRepo;
    service.activityRepository = mockActivityRepo;
    service.notificationService = { createNotification: jest.fn() };
    service.templateRepository = { findByKey: jest.fn() };
  });

  describe('detectInactiveUsers', () => {
    it('should return users inactive for 14+ days', async () => {
      mockUserRepo.findMany.mockResolvedValue([{ id: 'u1', name: 'Inactive Runner' }]);
      const result = await service.detectInactiveUsers(14);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u1');
    });
  });

  describe('detectChurnRisk', () => {
    it('should return at-risk premium users', async () => {
      mockSubRepo.findAllActiveUserIds.mockResolvedValue(['u1', 'u2']);
      mockUserRepo.findNonDeletedById
        .mockResolvedValueOnce({ id: 'u1', last_activity_at: new Date('2020-01-01') })
        .mockResolvedValueOnce({ id: 'u2', last_activity_at: new Date() });

      const result = await service.detectChurnRisk(21);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u1');
    });
  });

  describe('runRetentionCampaign', () => {
    it('should notify inactive users', async () => {
      mockUserRepo.findMany.mockResolvedValue([{ id: 'u1', email: 'test@test.com' }]);
      service.templateRepository.findByKey = jest.fn().mockResolvedValue(null);

      const result = await service.runRetentionCampaign();
      expect(result.campaign).toBe('retention');
    });
  });
});
