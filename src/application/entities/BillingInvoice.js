export class BillingInvoice {
  constructor({ id, userId, subscriptionId, invoiceNumber, amount, currency, status, paymentMethod, provider, providerInvoiceId, paidAt, dueAt, lines, metadata, createdAt, updatedAt }) {
    this.id = id;
    this.userId = userId;
    this.subscriptionId = subscriptionId;
    this.invoiceNumber = invoiceNumber;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.paymentMethod = paymentMethod;
    this.provider = provider;
    this.providerInvoiceId = providerInvoiceId;
    this.paidAt = paidAt;
    this.dueAt = dueAt;
    this.lines = lines;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export default BillingInvoice;
