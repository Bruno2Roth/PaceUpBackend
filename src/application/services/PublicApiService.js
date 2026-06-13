import crypto from 'crypto';
import OAuthAppRepository from '../../data/repositories/OAuthAppRepository.js';
import OAuthTokenRepository from '../../data/repositories/OAuthTokenRepository.js';

export class PublicApiService {
  constructor() {
    this.oauthAppRepository = new OAuthAppRepository();
    this.oauthTokenRepository = new OAuthTokenRepository();
  }

  generateClientId() {
    return crypto.randomBytes(24).toString('hex');
  }

  generateClientSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateToken() {
    return crypto.randomBytes(48).toString('hex');
  }

  async registerApp(data, ownerId) {
    if (!data.name) {
      const err = new Error('App name is required');
      err.status = 400;
      throw err;
    }

    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();

    const app = await this.oauthAppRepository.create({
      name: data.name.trim(),
      description: data.description || null,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: data.redirectUris ? JSON.stringify(data.redirectUris) : '[]',
      scopes: data.scopes ? JSON.stringify(data.scopes) : '["profile"]',
      owner_id: ownerId,
      is_active: true,
    });

    return app;
  }

  async authorizeApp(clientId, userId, scopes) {
    const app = await this.oauthAppRepository.findByClientId(clientId);
    if (!app || !app.is_active) {
      const err = new Error('Invalid or inactive app');
      err.status = 401;
      throw err;
    }

    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const token = await this.oauthTokenRepository.create({
      app_id: app.id,
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      scopes: JSON.stringify(scopes),
      expires_at: expiresAt,
    });

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
      scopes,
    };
  }

  async validateToken(accessToken) {
    const token = await this.oauthTokenRepository.findByAccessToken(accessToken);
    if (!token) {
      const err = new Error('Invalid token');
      err.status = 401;
      throw err;
    }

    if (new Date(token.expires_at) < new Date()) {
      const err = new Error('Token expired');
      err.status = 401;
      throw err;
    }

    return {
      userId: token.user_id,
      scopes: typeof token.scopes === 'string' ? JSON.parse(token.scopes) : token.scopes,
      appId: token.app_id,
    };
  }

  async refreshAccessToken(refreshToken) {
    const token = await this.oauthTokenRepository.findByRefreshToken(refreshToken);
    if (!token) {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      throw err;
    }

    if (new Date(token.expires_at) < new Date()) {
      const err = new Error('Refresh token expired');
      err.status = 401;
      throw err;
    }

    const newAccessToken = this.generateToken();
    const newRefreshToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.oauthTokenRepository.update(token.id, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  async listUserApps(userId) {
    const tokens = await this.oauthTokenRepository.findByUser(userId);
    const appIds = [...new Set(tokens.map(t => t.app_id))];
    const apps = [];
    for (const appId of appIds) {
      const app = await this.oauthAppRepository.findById(appId);
      if (app) {
        const appTokens = tokens.filter(t => t.app_id === appId);
        apps.push({
          ...app,
          tokens: appTokens,
        });
      }
    }
    return apps;
  }

  async revokeApp(userId, appId) {
    await this.oauthTokenRepository.revokeByUser(userId, appId);
    return { message: 'Tokens revoked successfully' };
  }
}

export default PublicApiService;
