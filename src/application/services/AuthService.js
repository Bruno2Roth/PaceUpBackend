import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../configs/environment.js';
import UserRepository from '../../data/repositories/UserRepository.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.saltRounds = 10;
  }

  async register({ email, password, name }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(password, this.saltRounds);

    const user = await this.userRepository.create({
      email,
      password: hashed,
      name,
    });

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.expiration,
    });

    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.refreshExpiration,
    });

    // Do not return password
    delete user.password;

    return { user, accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.expiration,
    });

    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
      algorithm: config.jwt.algorithm,
      expiresIn: config.jwt.refreshExpiration,
    });

    await this.userRepository.updateLastLogin(user.id);

    delete user.password;

    return { user, accessToken, refreshToken };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
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

  async logout(/* userId */) {
    // For stateless JWT, logout can be handled client-side by deleting tokens.
    // Implement token blacklist in Redis if needed in future.
    return true;
  }

  // Additional helpers (email verification, password reset) will be implemented later.
}

export default AuthService;
