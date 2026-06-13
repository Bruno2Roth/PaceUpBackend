import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';
import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';

export class BillingService {
  constructor() {
    this.invoiceRepository = new BillingInvoiceRepository();
    this.subscriptionRepository = new SubscriptionRepository();
  }

  async getHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.invoiceRepository.findMany('user_id = $1', [userId], limit, offset);
  }

  async getInvoices(userId) {
    return this.invoiceRepository.findByUserId(userId);
  }

  async getInvoiceById(invoiceId, userId) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found');
      err.status = 404;
      throw err;
    }
    if (invoice.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }
    return invoice;
  }

  async getAdminStats() {
    const totalRevenue = await this.invoiceRepository.revenueBetween(
      new Date('2020-01-01'), new Date()
    );
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = await this.invoiceRepository.revenueBetween(monthStart, new Date());

    const activeSubs = await this.subscriptionRepository.count("status = 'active' AND current_period_end > CURRENT_TIMESTAMP");
    const canceledSubs = await this.subscriptionRepository.count("status = 'canceled'");
    const trialSubs = await this.subscriptionRepository.count("status = 'trial'");

    return { totalRevenue, monthlyRevenue, activeSubscriptions: activeSubs, canceledSubscriptions: canceledSubs, trialSubscriptions: trialSubs };
  }

  async getRevenueMetrics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const mrr = await this.invoiceRepository.revenueBetween(monthStart, monthEnd);
    const prevMrr = await this.invoiceRepository.revenueBetween(prevMonthStart, prevMonthEnd);
    const arr = mrr * 12;

    const activeUsers = await this.subscriptionRepository.count("status = 'active' AND current_period_end > CURRENT_TIMESTAMP");
    const arpu = activeUsers > 0 ? mrr / activeUsers : 0;

    const mrrGrowth = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0;

    const canceled = await this.subscriptionRepository.count("status = 'canceled'");
    const total = activeUsers + canceled;
    const churnRate = total > 0 ? (canceled / total) * 100 : 0;

    const conversions = await this.subscriptionRepository.count("status = 'active' AND current_period_end > CURRENT_TIMESTAMP AND created_at > $1", [monthStart]);

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      mrr_growth: Math.round(mrrGrowth * 100) / 100,
      churn_rate: Math.round(churnRate * 100) / 100,
      conversions,
      active_users: activeUsers,
      period: { month: now.getMonth() + 1, year: now.getFullYear() },
    };
  }
}
export default BillingService;
