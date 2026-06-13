export class Subscription {
  constructor({
    id, userId, planId, status,
    currentPeriodStart, currentPeriodEnd,
    cancelAtPeriodEnd, trialEnd,
    stripeSubscriptionId, stripeCustomerId,
    createdAt, updatedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.planId = planId;
    this.status = status;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.trialEnd = trialEnd;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.stripeCustomerId = stripeCustomerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Subscription;
