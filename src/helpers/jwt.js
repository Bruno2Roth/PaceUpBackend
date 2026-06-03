import jwt from 'jsonwebtoken';
import config from '../configs/environment.js';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: config.jwt.algorithm,
    expiresIn: config.jwt.expiration,
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    algorithm: config.jwt.algorithm,
    expiresIn: config.jwt.refreshExpiration,
  });
};

export default { signAccessToken, signRefreshToken };
