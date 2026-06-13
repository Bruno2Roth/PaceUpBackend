import PublicApiService from '../../application/services/PublicApiService.js';
import logger from '../../configs/logger.js';

const publicApiService = new PublicApiService();

export const publicApiMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const result = await publicApiService.validateToken(token);
    req.userId = result.userId;
    req.scopes = result.scopes;

    next();
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ error: error.message });
    }
    logger.error('Public API middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export default publicApiMiddleware;
