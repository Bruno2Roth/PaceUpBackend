import CommercialAnalyticsService from '../../application/services/CommercialAnalyticsService.js';
import BillingService from '../../application/services/BillingService.js';
import RetentionService from '../../application/services/RetentionService.js';

export class AdminCommercialController {
  constructor() {
    this.analyticsService = new CommercialAnalyticsService();
    this.billingService = new BillingService();
    this.retentionService = new RetentionService();
  }

  getSubscriptions = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await this.analyticsService.getAdminSubscriptions(page, limit);
      res.json(result);
    } catch (err) { next(err); }
  };

  getRevenue = async (req, res, next) => {
    try {
      const start = req.query.start ? new Date(req.query.start) : undefined;
      const end = req.query.end ? new Date(req.query.end) : undefined;
      const result = await this.analyticsService.getRevenue(start, end);
      res.json(result);
    } catch (err) { next(err); }
  };

  getConversions = async (req, res, next) => {
    try {
      const start = req.query.start ? new Date(req.query.start) : undefined;
      const end = req.query.end ? new Date(req.query.end) : undefined;
      const result = await this.analyticsService.getConversions(start, end);
      res.json(result);
    } catch (err) { next(err); }
  };

  getChurn = async (req, res, next) => {
    try {
      const start = req.query.start ? new Date(req.query.start) : undefined;
      const end = req.query.end ? new Date(req.query.end) : undefined;
      const result = await this.analyticsService.getChurn(start, end);
      res.json(result);
    } catch (err) { next(err); }
  };

  getAnalytics = async (req, res, next) => {
    try {
      const result = await this.analyticsService.getAnalytics();
      res.json(result);
    } catch (err) { next(err); }
  };

  getRevenueMetrics = async (req, res, next) => {
    try {
      const result = await this.billingService.getRevenueMetrics();
      res.json(result);
    } catch (err) { next(err); }
  };

  getCoupons = async (req, res, next) => {
    try {
      const coupons = await this.analyticsService.getAdminCoupons();
      res.json({ coupons });
    } catch (err) { next(err); }
  };

  runRetention = async (req, res, next) => {
    try {
      const result = await this.retentionService.runRetentionCampaign();
      res.json(result);
    } catch (err) { next(err); }
  };

  runWinback = async (req, res, next) => {
    try {
      const result = await this.retentionService.runWinbackCampaign();
      res.json(result);
    } catch (err) { next(err); }
  };
}
export default AdminCommercialController;
