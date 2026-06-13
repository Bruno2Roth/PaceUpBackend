import SubscriptionService from '../../application/services/SubscriptionService.js';

export class SubscriptionController {
  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  getPlans = async (req, res, next) => {
    try {
      const plans = await this.subscriptionService.getPlans();
      res.json({ plans });
    } catch (err) { next(err); }
  };

  getMySubscription = async (req, res, next) => {
    try {
      const sub = await this.subscriptionService.getUserSubscription(req.userId);
      res.json(sub);
    } catch (err) { next(err); }
  };

  subscribe = async (req, res, next) => {
    try {
      const { planCode, paymentProvider, paymentData } = req.body;
      if (!planCode) return res.status(400).json({ error: 'planCode is required' });
      const sub = await this.subscriptionService.subscribe(req.userId, planCode, paymentProvider || 'manual', paymentData);
      res.status(201).json(sub);
    } catch (err) { next(err); }
  };

  cancel = async (req, res, next) => {
    try {
      const updated = await this.subscriptionService.cancel(req.userId);
      res.json(updated);
    } catch (err) { next(err); }
  };

  reactivate = async (req, res, next) => {
    try {
      const updated = await this.subscriptionService.reactivate(req.userId);
      res.json(updated);
    } catch (err) { next(err); }
  };

  startTrial = async (req, res, next) => {
    try {
      const { planCode, durationDays } = req.body;
      const sub = await this.subscriptionService.startTrial(req.userId, planCode || 'premium_monthly', durationDays || 7);
      res.status(201).json(sub);
    } catch (err) { next(err); }
  };

  getTrialStatus = async (req, res, next) => {
    try {
      const status = await this.subscriptionService.getTrialStatus(req.userId);
      res.json(status);
    } catch (err) { next(err); }
  };

  getHistory = async (req, res, next) => {
    try {
      const history = await this.subscriptionService.getHistory(req.userId);
      res.json({ history });
    } catch (err) { next(err); }
  };
}
export default SubscriptionController;
