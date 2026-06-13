import CouponService from '../../application/services/CouponService.js';

export class CouponController {
  constructor() {
    this.couponService = new CouponService();
  }

  validate = async (req, res, next) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'code is required' });
      const result = await this.couponService.validate(code, req.userId);
      res.json(result);
    } catch (err) { next(err); }
  };

  redeem = async (req, res, next) => {
    try {
      const { code, subscriptionId } = req.body;
      if (!code) return res.status(400).json({ error: 'code is required' });
      const result = await this.couponService.redeem(code, req.userId, subscriptionId);
      res.json(result);
    } catch (err) { next(err); }
  };
}
export default CouponController;
