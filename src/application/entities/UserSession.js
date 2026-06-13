export class UserSession {
  constructor({
    id,
    userId,
    sessionStart,
    sessionEnd,
    ipAddress,
    userAgent,
    metadata,
  }) {
    this.id = id;
    this.userId = userId;
    this.sessionStart = sessionStart;
    this.sessionEnd = sessionEnd;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.metadata = metadata;
  }
}

export default UserSession;
