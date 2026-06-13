import BaseRepository from './BaseRepository.js';
import crypto from '../../helpers/crypto.js';

export class IntegrationRepository extends BaseRepository {
  constructor() {
    super('integration_connections');
  }

  async findByUserAndProvider(userId, provider) {
    const query = `
      SELECT * FROM integration_connections
      WHERE user_id = $1 AND provider = $2
    `;
    const result = await this.pool.query(query, [userId, provider]);
    if (!result.rows[0]) return null;
    return this.decryptTokens(result.rows[0]);
  }

  async findByProviderUserId(provider, providerUserId) {
    const query = `
      SELECT * FROM integration_connections
      WHERE provider = $1 AND provider_user_id = $2
    `;
    const result = await this.pool.query(query, [provider, providerUserId]);
    if (!result.rows[0]) return null;
    return this.decryptTokens(result.rows[0]);
  }

  async findByUserId(userId) {
    const query = `
      SELECT id, user_id, provider, provider_username, avatar_url,
        is_connected, last_sync_at, sync_enabled, created_at, updated_at
      FROM integration_connections
      WHERE user_id = $1
      ORDER BY provider ASC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(r => ({
      ...r,
      has_token: true,
    }));
  }

  async upsertConnection(userId, provider, data) {
    const encrypted = this.encryptSensitive(data);
    const existing = await this.findByUserAndProvider(userId, provider);

    if (existing) {
      const updateData = { ...encrypted, is_connected: true, updated_at: new Date() };
      return this.update(existing.id, updateData);
    }

    return this.create({
      user_id: userId,
      provider,
      ...encrypted,
      is_connected: true,
    });
  }

  async updateTokens(userId, provider, tokenData) {
    const existing = await this.findByUserAndProvider(userId, provider);
    if (!existing) return null;

    const encrypted = {};
    if (tokenData.access_token) encrypted.access_token = crypto.encrypt(tokenData.access_token);
    if (tokenData.refresh_token) encrypted.refresh_token = crypto.encrypt(tokenData.refresh_token);
    if (tokenData.expires_at) encrypted.expires_at = tokenData.expires_at;
    if (tokenData.token_type) encrypted.token_type = tokenData.token_type;
    if (tokenData.scope) encrypted.scope = tokenData.scope;

    return this.update(existing.id, { ...encrypted, updated_at: new Date() });
  }

  async updateLastSync(userId, provider) {
    const existing = await this.findByUserAndProvider(userId, provider);
    if (!existing) return null;
    return this.update(existing.id, { last_sync_at: new Date() });
  }

  async setSyncEnabled(userId, provider, enabled) {
    const existing = await this.findByUserAndProvider(userId, provider);
    if (!existing) return null;
    return this.update(existing.id, { sync_enabled: enabled });
  }

  async disconnect(userId, provider) {
    const existing = await this.findByUserAndProvider(userId, provider);
    if (!existing) return null;
    return this.update(existing.id, {
      is_connected: false,
      access_token: null,
      refresh_token: null,
      expires_at: null,
      token_type: null,
      scope: null,
      provider_user_id: null,
      provider_username: null,
      avatar_url: null,
      last_sync_at: null,
      sync_enabled: false,
    });
  }

  async findAllWithExpiredTokens(provider) {
    const query = `
      SELECT * FROM integration_connections
      WHERE provider = $1
        AND is_connected = TRUE
        AND refresh_token IS NOT NULL
        AND expires_at < CURRENT_TIMESTAMP
    `;
    const result = await this.pool.query(query, [provider]);
    return result.rows.map(r => this.decryptTokens(r));
  }

  async findAllConnected(provider) {
    const query = `
      SELECT * FROM integration_connections
      WHERE provider = $1 AND is_connected = TRUE AND sync_enabled = TRUE
    `;
    const result = await this.pool.query(query, [provider]);
    return result.rows.map(r => this.decryptTokens(r));
  }

  encryptSensitive(data) {
    const result = { ...data };
    if (result.access_token) result.access_token = crypto.encrypt(result.access_token);
    if (result.refresh_token) result.refresh_token = crypto.encrypt(result.refresh_token);
    return result;
  }

  decryptTokens(row) {
    if (!row) return null;
    const result = { ...row };
    if (result.access_token) result.access_token = crypto.decrypt(result.access_token);
    if (result.refresh_token) result.refresh_token = crypto.decrypt(result.refresh_token);
    return result;
  }
}

export class SyncLogRepository extends BaseRepository {
  constructor() {
    super('sync_logs');
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    return this.findMany('user_id = $1', [userId], limit, offset);
  }

  async findByProvider(provider, limit = 50, offset = 0) {
    return this.findMany('provider = $1', [provider], limit, offset);
  }

  async findRecentByUserAndProvider(userId, provider, limit = 10) {
    const query = `
      SELECT * FROM sync_logs
      WHERE user_id = $1 AND provider = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [userId, provider, limit]);
    return result.rows;
  }

  async findLastSync(userId, provider) {
    const query = `
      SELECT * FROM sync_logs
      WHERE user_id = $1 AND provider = $2 AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId, provider]);
    return result.rows[0] || null;
  }
}

export class WebhookEventRepository extends BaseRepository {
  constructor() {
    super('webhook_events');
  }

  async findByProvider(provider, limit = 50, offset = 0) {
    return this.findMany('provider = $1', [provider], limit, offset);
  }

  async findRecentByProvider(provider, limit = 20) {
    const query = `
      SELECT * FROM webhook_events
      WHERE provider = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [provider, limit]);
    return result.rows;
  }
}

export default IntegrationRepository;
