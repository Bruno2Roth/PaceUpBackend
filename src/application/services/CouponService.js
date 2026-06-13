import CouponRepository from '../../data/repositories/CouponRepository.js';
import CouponRedemptionRepository from '../../data/repositories/CouponRedemptionRepository.js';
import SubscriptionRepository from '../../data/repositories/SubscriptionRepository.js';
import BillingInvoiceRepository from '../../data/repositories/BillingInvoiceRepository.js';
import NotificationService from './NotificationService.js';

export class CouponService {
  constructor() {
    this.couponRepository = new CouponRepository();
    this.redemptionRepository = new CouponRedemptionRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new BillingInvoiceRepository();
    this.notificationService = new NotificationService();
  }

  async validate(code, userId) {
    const coupon = await this.couponRepository.findValid(code);
    if (!coupon) {
      const err = new Error('Invalid or expired coupon');
      err.status = 404;
      throw err;
    }

    if (coupon.max_redemptions > 0 && coupon.current_redemptions >= coupon.max_redemptions) {
      const err = new Error('Coupon redemption limit reached');
      err.status = 400;
      throw err;
    }

    const userRedemptions = await this.redemptionRepository.countByUserAndCoupon(userId, coupon.id);
    if (userRedemptions > 0) {
      const err = new Error('Coupon already redeemed by this user');
      err.status = 400;
      throw err;
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      const err = new Error('Coupon not yet valid');
      err.status = 400;
      throw err;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      const err = new Error('Coupon has expired');
      err.status = 400;
      throw err;
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_amount: coupon.min_amount,
        applies_to_plans: coupon.applies_to_plans,
      },
    };
  }

  async redeem(code, userId, subscriptionId) {
    const { coupon } = await this.validate(code, userId);

    const updated = await this.couponRepository.incrementRedemptions(coupon.id);

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = coupon.discount_value;
    }

    const redemption = await this.redemptionRepository.create({
      coupon_id: updated.id,
      user_id: userId,
      subscription_id: subscriptionId,
      discount_amount: discountAmount,
    });

    try {
      await this.notificationService.createNotification({
        userId,
        type: 'coupon_received',
        title: 'Cupón aplicado',
        message: `Has aplicado el cupón ${code} con un descuento de ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value}`,
        metadata: { coupon_code: code, discount_amount: discountAmount, discount_type: coupon.discount_type },
      });
    } catch {}

    return { redemption, discount: { type: coupon.discount_type, value: coupon.discount_value, amount: discountAmount } };
  }
}
export default CouponService;
