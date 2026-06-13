import PremiumService from '../../application/services/PremiumService.js';

const premiumService = new PremiumService();

export function premiumMiddleware(featureCode = null) {
  return async (req, res, next) => {
    try {
      await premiumService.requirePremium(req.userId, featureCode);
      next();
    } catch (error) {
      if (error.status === 403) {
        return res.status(403).json({
          error: error.message,
          code: error.code || 'PREMIUM_REQUIRED',
          is_premium: false,
        });
      }
      next(error);
    }
  };
}

export default premiumMiddleware;
