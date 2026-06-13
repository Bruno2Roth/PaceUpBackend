import axios from 'axios';
import config from '../../configs/environment.js';
import { generateState, buildAuthorizationUrl, exchangeCode, refreshAccessToken, isTokenExpired } from '../../helpers/oauth2.js';

const PROVIDER = 'polar';
const API_BASE = config.polar.apiUrl || 'https://www.polaraccesslink.com';
const AUTH_BASE = 'https://polarremote.com/v2';

export class PolarService {
  constructor() {}

  getAuthorizationUrl(state) {
    const params = {
      response_type: 'code',
      client_id: config.polar.clientId,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/polar/callback`,
      scope: 'accesslink.read_all',
      state,
    };
    return buildAuthorizationUrl(`${AUTH_BASE}/oauth/authorize`, params);
  }

  async exchangeCodeForToken(code) {
    const authHeader = this.getBasicAuthHeader();
    const data = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/polar/callback`,
    };
    const result = await exchangeCode(`${AUTH_BASE}/oauth/token`, data, authHeader);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      token_type: result.token_type,
      scope: result.scope,
      provider_user_id: result.x_user_id?.toString(),
    };
  }

  async refreshAccessToken(refreshToken) {
    const authHeader = this.getBasicAuthHeader();
    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    const result = await refreshAccessToken(`${AUTH_BASE}/oauth/token`, data, authHeader);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token || refreshToken,
      expires_in: result.expires_in,
    };
  }

  getBasicAuthHeader() {
    const credentials = Buffer.from(`${config.polar.clientId}:${config.polar.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async fetchUserInfo(accessToken) {
    const response = await axios.get(`${API_BASE}/v3/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async fetchActivities(accessToken, startDate, endDate) {
    const params = { limit: 100 };
    if (startDate) params.from = startDate;
    if (endDate) params.to = endDate;
    const response = await axios.get(`${API_BASE}/v3/exercises`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    return response.data?.data || response.data || [];
  }

  async fetchActivityDetails(accessToken, exerciseId) {
    const response = await axios.get(`${API_BASE}/v3/exercises/${exerciseId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async fetchActivitySamples(accessToken, exerciseId) {
    try {
      const response = await axios.get(`${API_BASE}/v3/exercises/${exerciseId}/samples`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  convertActivity(polarActivity) {
    const activityType = this.mapActivityType(polarActivity.detailed_sport_info || polarActivity.sport);
    const startTime = polarActivity.start_time || polarActivity.start;
    const endTime = polarActivity.end_time || polarActivity.stop;

    return {
      title: polarActivity.name || `${activityType} - ${new Date(startTime).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: Math.round((polarActivity.distance || 0) * 1000),
      duration_seconds: polarActivity.duration || 0,
      start_time: startTime,
      end_time: endTime,
      elevation_gain_m: polarActivity.elevation_gain || null,
      elevation_loss_m: polarActivity.elevation_loss || null,
      average_heartrate: polarActivity.heart_rate?.average || null,
      max_heartrate: polarActivity.heart_rate?.maximum || null,
      calories_burned: polarActivity.calories || null,
      average_speed_kmh: polarActivity.average_speed || null,
      max_speed_kmh: polarActivity.max_speed || null,
      gps_data: null,
      is_workout: true,
      source: 'polar',
      source_id: polarActivity.id?.toString(),
    };
  }

  mapActivityType(sport) {
    const map = {
      running: 'running',
      trail_running: 'trail_running',
      treadmill: 'treadmill',
      cycling: 'cycling',
      mountain_biking: 'cycling',
      walking: 'walking',
      hiking: 'hiking',
      swimming: 'swimming',
      strength_training: 'strength',
      cardio_training: 'cardio',
      yoga: 'yoga',
      other_indoor: 'other',
      other_outdoor: 'other',
    };
    if (!sport) return 'running';
    const key = sport.toLowerCase().replace(/\s+/g, '_');
    return map[key] || 'other';
  }
}

export default PolarService;
