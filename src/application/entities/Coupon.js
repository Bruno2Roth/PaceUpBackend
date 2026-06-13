export class Coupon {
  constructor({ id, code, description, discountType, discountValue, minAmount, maxRedemptions, currentRedemptions, validFrom, validUntil, isActive, appliesToPlans, metadata, createdAt, updatedAt }) {
    this.id = id;
    this.code = code;
    this.description = description;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.minAmount = minAmount;
    this.maxRedemptions = maxRedemptions;
    this.currentRedemptions = currentRedemptions;
    this.validFrom = validFrom;
    this.validUntil = validUntil;
    this.isActive = isActive;
    this.appliesToPlans = appliesToPlans;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export default Coupon;
