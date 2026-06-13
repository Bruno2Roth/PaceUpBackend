import { validationResult } from 'express-validator';
import AuthService from '../../application/services/AuthService.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, name, username } = req.body;
      const result = await this.authService.register({ email, password, name, username });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      const result = await this.authService.login(email, password, req.ip, req.get('user-agent'));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken required' });
      }
      const result = await this.authService.refreshToken(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await this.authService.logout(req.userId, req.ip, req.get('user-agent'));
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }
      const result = await this.authService.verifyEmail(token);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendVerification(req, res, next) {
    try {
      const result = await this.authService.sendEmailVerification(req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const result = await this.authService.resendVerification(req.userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }
      const result = await this.authService.forgotPassword(email, req.ip, req.get('user-agent'));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async validateResetToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }
      const result = await this.authService.validateResetToken(token);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password required' });
      }
      const result = await this.authService.resetPassword(token, password, req.ip, req.get('user-agent'));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
