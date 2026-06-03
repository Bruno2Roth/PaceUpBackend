import { Router } from 'express';
import AuthController from '../api/controllers/AuthController.js';
import { authRateLimit } from '../api/middlewares/rateLimitMiddleware.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authRateLimit, controller.register.bind(controller));
router.post('/login', authRateLimit, controller.login.bind(controller));
router.post('/refresh', controller.refreshToken.bind(controller));
router.post('/logout', controller.logout.bind(controller));
router.get('/verify', controller.verifyEmail.bind(controller));
router.post('/password/request', controller.requestPasswordReset.bind(controller));
router.post('/password/reset', controller.resetPassword.bind(controller));

export default router;
