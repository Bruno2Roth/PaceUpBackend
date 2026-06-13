export class OAuthApp {
  constructor({
    id,
    name,
    description,
    clientId,
    clientSecret,
    redirectUris,
    scopes,
    ownerId,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUris = redirectUris;
    this.scopes = scopes;
    this.ownerId = ownerId;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default OAuthApp;
