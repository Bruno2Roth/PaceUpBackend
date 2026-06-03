export class GarminService {
  constructor() {
    // Prepare Garmin API integration (OAuth, sync endpoints)
  }

  async getAuthorizationUrl(state) {
    // TODO: Build Garmin OAuth authorization URL
    return null;
  }

  async exchangeCodeForToken(code) {
    // TODO: Exchange OAuth code for access token
    return null;
  }

  async refreshToken(refreshToken) {
    // TODO: Refresh Garmin access token
    return null;
  }

  async fetchUserActivities(accessToken, fromDate, toDate) {
    // TODO: Fetch activities from Garmin Connect
    return [];
  }

  async fetchActivityDetails(accessToken, activityId) {
    // TODO: Fetch single activity details
    return null;
  }
}

export default GarminService;
