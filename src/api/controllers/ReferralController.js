import ReferralService from '../../application/services/ReferralService.js';

export class ReferralController {
  constructor() {
    this.referralService = new ReferralService();
  }

  getMyReferrals = async (req, res, next) => {
    try {
      const info = await this.referralService.getReferralInfo(req.userId);
      res.json(info);
    } catch (err) { next(err); }
  };

  invite = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email is required' });
      const result = await this.referralService.invite(req.userId, email);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  getHistory = async (req, res, next) => {
    try {
      const history = await this.referralService.getHistory(req.userId);
      res.json({ referrals: history });
    } catch (err) { next(err); }
  };
}
export default ReferralController;
