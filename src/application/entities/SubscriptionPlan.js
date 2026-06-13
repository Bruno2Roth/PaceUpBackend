export class SubscriptionPlan {
  constructor({
    id, name, code, description,
    priceMonthly, priceYearly, currency,
    features, isActive, createdAt, updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.description = description;
    this.priceMonthly = priceMonthly;
    this.priceYearly = priceYearly;
    this.currency = currency;
    this.features = features;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default SubscriptionPlan;
