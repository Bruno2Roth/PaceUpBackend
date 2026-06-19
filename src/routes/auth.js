import { Router } from 'express';
import AuthController from '../api/controllers/AuthController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import { authRateLimit } from '../api/middlewares/rateLimitMiddleware.js';
import { registerValidation } from '../validations/registerValidation.js';
import { loginValidation } from '../validations/loginValidation.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authRateLimit, registerValidation, controller.register.bind(controller));
router.post('/login', authRateLimit, loginValidation, controller.login.bind(controller));
router.post('/google', controller.googleLogin.bind(controller));
router.post('/refresh', controller.refreshToken.bind(controller));
router.post('/logout', authMiddleware, controller.logout.bind(controller));

router.get('/verify-email', controller.verifyEmail.bind(controller));
router.post('/verify-email/send', authMiddleware, controller.sendVerification.bind(controller));
router.post('/verify-email/resend', authMiddleware, controller.resendVerification.bind(controller));

router.post('/forgot-password', controller.forgotPassword.bind(controller));
router.post('/validate-reset-token', controller.validateResetToken.bind(controller));
router.post('/reset-password', controller.resetPassword.bind(controller));

export default router;
