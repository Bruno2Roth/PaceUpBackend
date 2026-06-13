export class OAuthToken {
  constructor({
    id,
    appId,
    userId,
    accessToken,
    refreshToken,
    scopes,
    expiresAt,
    createdAt,
  }) {
    this.id = id;
    this.appId = appId;
    this.userId = userId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.scopes = scopes;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }
}

export default OAuthToken;
