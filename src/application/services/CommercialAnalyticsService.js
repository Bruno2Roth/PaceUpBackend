import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';
import CouponRepository from '../../data/repositories/CouponRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';

export class CommercialAnalyticsService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new BillingInvoiceRepository();
    this.couponRepository = new CouponRepository();
    this.userRepository = new UserRepository();
  }

  async getAdminSubscriptions(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const rows = await this.subscriptionRepository.pool.query(
      `SELECT s.*, u.name as user_name, u.email as user_email, sp.name as plan_name, sp.code as plan_code
       FROM subscriptions s
       INNER JOIN users u ON s.user_id = u.id
       INNER JOIN subscription_plans sp ON s.plan_id = sp.id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]
    ).then(r => r.rows);
    const total = await this.subscriptionRepository.count();
    return { subscriptions: rows, total, page, limit };
  }

  async getRevenue(startDate, endDate) {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date();
    const revenue = await this.invoiceRepository.revenueBetween(start, end);
    const byStatus = {
      paid: await this.invoiceRepository.countByStatus('paid'),
      pending: await this.invoiceRepository.countByStatus('pending'),
      failed: await this.invoiceRepository.countByStatus('failed'),
      refunded: await this.invoiceRepository.countByStatus('refunded'),
    };
    return { revenue, period: { start, end }, by_status: byStatus };
  }

  async getConversions(startDate, endDate) {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date();

    const totalSignups = await this.userRepository.count(
      'created_at BETWEEN $1 AND $2', [start, end]
    );
    const conversions = await this.subscriptionRepository.count(
      "status = 'active' AND created_at BETWEEN $1 AND $2", [start, end]
    );

    return {
      period: { start, end },
      total_signups: totalSignups,
      conversions,
      conversion_rate: totalSignups > 0 ? Math.round((conversions / totalSignups) * 10000) / 100 : 0,
    };
  }

  async getChurn(startDate, endDate) {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const end = endDate || new Date();

    const canceled = await this.subscriptionRepository.count(
      "status = 'canceled' AND updated_at BETWEEN $1 AND $2", [start, end]
    );
    const activeAtStart = await this.subscriptionRepository.count(
      "status = 'active' AND created_at < $1", [start]
    );
    const churnRate = activeAtStart > 0 ? Math.round((canceled / activeAtStart) * 10000) / 100 : 0;

    return {
      period: { start, end },
      canceled,
      active_at_start: activeAtStart,
      churn_rate: churnRate,
    };
  }

  async getAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = await this.userRepository.count();
    const activeSubs = await this.subscriptionRepository.count("status = 'active' AND current_period_end > CURRENT_TIMESTAMP");

    const mrr = await this.invoiceRepository.revenueBetween(monthStart, now);
    const arr = mrr * 12;
    const arpu = activeSubs > 0 ? mrr / activeSubs : 0;
    const churnData = await this.getChurn();

    const totalSignups = await this.userRepository.count();
    const conversions = await this.subscriptionRepository.count("status = 'active'");
    const conversionRate = totalSignups > 0 ? Math.round((conversions / totalSignups) * 10000) / 100 : 0;

    return {
      total_users: totalUsers,
      active_subscriptions: activeSubs,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      churn_rate: churnData.churn_rate,
      conversion_rate: conversionRate,
      period: { month: now.getMonth() + 1, year: now.getFullYear() },
    };
  }

  async getAdminCoupons() {
    return this.couponRepository.findAll(100, 0);
  }
}
export default CommercialAnalyticsService;
