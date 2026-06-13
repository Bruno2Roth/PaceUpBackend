export class PaymentHistory {
  constructor({
    id, userId, subscriptionId, amount, currency,
    status, paymentMethod,
    stripePaymentIntentId, stripeInvoiceId,
    metadata, createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.subscriptionId = subscriptionId;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.paymentMethod = paymentMethod;
    this.stripePaymentIntentId = stripePaymentIntentId;
    this.stripeInvoiceId = stripeInvoiceId;
    this.metadata = metadata;
    this.createdAt = createdAt;
  }
}

export default PaymentHistory;
