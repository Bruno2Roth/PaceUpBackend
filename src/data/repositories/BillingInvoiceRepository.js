import BaseRepository from './BaseRepository.js';

export class BillingInvoiceRepository extends BaseRepository {
  constructor() {
    super('billing_invoices');
  }

  async findByUserId(userId) {
    return this.findMany('user_id = $1', [userId], 50, 0);
  }

  async findByInvoiceNumber(invoiceNumber) {
    return this.findOne('invoice_number = $1', [invoiceNumber]);
  }

  async countByStatus(status) {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM billing_invoices WHERE status = $1', [status]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async revenueBetween(start, end) {
    const result = await this.pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM billing_invoices WHERE status = 'paid' AND paid_at BETWEEN $1 AND $2",
      [start, end]
    );
    return parseFloat(result.rows[0].total);
  }
}
export default BillingInvoiceRepository;
