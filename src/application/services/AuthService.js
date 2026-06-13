import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../configs/environment.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import VerificationTokenRepository from '../../data/repositories/VerificationTokenRepository.js';
import AuditService from './AuditService.js';
import { addJob, queueNames } from '../../configs/queue.js';
import logger from '../../configs/logger.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.verificationTokenRepo = new VerificationTokenRepository();
    this.auditService = new AuditService();
    this.saltRounds = 10;
  }

  _generateTokens(user) {
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.expiration,
    });
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.refreshExpiration,
    });
    return { accessToken, refreshToken };
  }

  async register({ email, password, name, username }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 400;
      throw err;
    }

    const existingUsername = await this.userRepository.findOne('username = $1', [username]);
    if (existingUsername) {
      const err = new Error('Username already taken');
      err.status = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(password, this.saltRounds);

    const user = await this.userRepository.create({
      email,
      password: hashed,
      name,
      username,
      is_active: true,
    });

    const tokens = this._generateTokens(user);

    const token = await this.verificationTokenRepo.createToken(user.id, 'email_verification', 24);
    await addJob(queueNames.EMAILS, 'send-verification', {
      type: 'verify',
      to: email,
      token: token.token,
    }).catch(err => logger.warn('Failed to queue verification email:', err.message));

    delete user.password;
    return { user, ...tokens };
  }

  async login(identifier, password, ip, userAgent) {
    const user = await this.userRepository.findByEmailOrUsername(identifier);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    if (user.is_banned) {
      const err = new Error('Account banned');
      err.status = 403;
      throw err;
    }

    if (user.is_suspended && user.suspended_until && new Date(user.suspended_until) > new Date()) {
      const err = new Error('Account suspended');
      err.status = 403;
      throw err;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const tokens = this._generateTokens(user);
    await this.userRepository.updateLastLogin(user.id);

    this.auditService.logLogin(user.id, ip, userAgent).catch(() => {});

    delete user.password;
    return { user, ...tokens };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.deleted_at) {
        const err = new Error('Invalid refresh token');
        err.status = 401;
        throw err;
      }

      const accessToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret, {
        algorithm: config.jwt.algorithm,
        expiresIn: config.jwt.expiration,
      });

      return { accessToken };
    } catch (error) {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      throw err;
    }
  }

  async logout(userId, ip, userAgent) {
    this.auditService.logLogout(userId, ip, userAgent).catch(() => {});
    return true;
  }

  async sendEmailVerification(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    if (user.email_verified_at) {
      const err = new Error('Email already verified');
      err.status = 400;
      throw err;
    }

    await this.verificationTokenRepo.invalidateUserTokens(userId, 'email_verification');
    const token = await this.verificationTokenRepo.createToken(userId, 'email_verification', 24);

    await addJob(queueNames.EMAILS, 'send-verification', {
      type: 'verify',
      to: user.email,
      token: token.token,
    }).catch(err => logger.warn('Failed to queue verification email:', err.message));

    return { sent: true };
  }

  async verifyEmail(token) {
    const record = await this.verificationTokenRepo.findByToken(token);
    if (!record) {
      const err = new Error('Invalid or expired token');
      err.status = 400;
      throw err;
    }
    if (record.type !== 'email_verification') {
      const err = new Error('Invalid token type');
      err.status = 400;
      throw err;
    }

    await this.verificationTokenRepo.markAsUsed(token);
    await this.userRepository.update(record.user_id, { email_verified_at: new Date() });
    logger.info(`Email verified for user ${record.user_id}`);

    return { verified: true };
  }

  async resendVerification(userId) {
    return this.sendEmailVerification(userId);
  }

  async forgotPassword(email, ip, userAgent) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { sent: true };
    }

    await this.verificationTokenRepo.invalidateUserTokens(user.id, 'password_reset');
    const token = await this.verificationTokenRepo.createToken(user.id, 'password_reset', 1);

    await addJob(queueNames.EMAILS, 'send-reset', {
      type: 'reset_password',
      to: email,
      token: token.token,
    }).catch(err => logger.warn('Failed to queue reset email:', err.message));

    return { sent: true };
  }

  async validateResetToken(token) {
    const record = await this.verificationTokenRepo.findByToken(token);
    if (!record || record.type !== 'password_reset') {
      const err = new Error('Invalid or expired token');
      err.status = 400;
      throw err;
    }
    return { valid: true, userId: record.user_id };
  }

  async resetPassword(token, newPassword, ip, userAgent) {
    const record = await this.verificationTokenRepo.findByToken(token);
    if (!record || record.type !== 'password_reset') {
      const err = new Error('Invalid or expired token');
      err.status = 400;
      throw err;
    }

    if (newPassword.length < 8) {
      const err = new Error('Password must be at least 8 characters');
      err.status = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(newPassword, this.saltRounds);
    await this.userRepository.update(record.user_id, { password: hashed });
    await this.verificationTokenRepo.markAsUsed(token);
    this.auditService.logPasswordChange(record.user_id, ip, userAgent).catch(() => {});

    return { reset: true };
  }
}

export default AuthService;
