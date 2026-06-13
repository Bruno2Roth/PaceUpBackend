import axios from 'axios';
import config from '../../configs/environment.js';
import { generateState, buildAuthorizationUrl, exchangeCode, refreshAccessToken, isTokenExpired } from '../../helpers/oauth2.js';

const PROVIDER = 'coros';
const API_BASE = config.coros.apiUrl || 'https://api.coros.com';
const AUTH_BASE = 'https://auth.coros.com';

export class CorosService {
  constructor() {}

  getAuthorizationUrl(state) {
    const params = {
      response_type: 'code',
      client_id: config.coros.apiKey,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/coros/callback`,
      scope: 'user_info activity:read',
      state,
    };
    return buildAuthorizationUrl(`${AUTH_BASE}/oauth/authorize`, params);
  }

  async exchangeCodeForToken(code) {
    const data = {
      grant_type: 'authorization_code',
      client_id: config.coros.apiKey,
      client_secret: config.coros.clientSecret,
      code,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/coros/callback`,
    };
    const result = await exchangeCode(`${AUTH_BASE}/oauth/token`, data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      token_type: result.token_type,
      scope: result.scope,
      provider_user_id: result.user_id?.toString(),
    };
  }

  async refreshAccessToken(refreshToken) {
    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.coros.apiKey,
      client_secret: config.coros.clientSecret,
    };
    const result = await refreshAccessToken(`${AUTH_BASE}/oauth/token`, data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token || refreshToken,
      expires_in: result.expires_in,
    };
  }

  async fetchActivities(accessToken, startDate, endDate) {
    const params = { page: 1, page_size: 100 };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await axios.get(`${API_BASE}/v1/activities`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    return response.data?.activities || response.data?.data || [];
  }

  async fetchActivityDetails(accessToken, activityId) {
    const response = await axios.get(`${API_BASE}/v1/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  convertActivity(corosActivity) {
    const activityType = this.mapActivityType(corosActivity.sport_type || corosActivity.type);
    return {
      title: corosActivity.name || `${activityType} - ${new Date(corosActivity.start_time).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: Math.round((corosActivity.distance || 0) * 1000),
      duration_seconds: corosActivity.duration || corosActivity.elapsed_time || 0,
      start_time: corosActivity.start_time,
      end_time: corosActivity.end_time,
      elevation_gain_m: corosActivity.elevation_gain || null,
      elevation_loss_m: corosActivity.elevation_loss || null,
      average_heartrate: corosActivity.avg_hr || null,
      max_heartrate: corosActivity.max_hr || null,
      calories_burned: corosActivity.calories || null,
      average_speed_kmh: corosActivity.avg_speed || null,
      max_speed_kmh: corosActivity.max_speed || null,
      gps_data: corosActivity.track_points ? this.convertTrackPoints(corosActivity.track_points) : null,
      is_workout: true,
      source: 'coros',
      source_id: corosActivity.id?.toString(),
    };
  }

  mapActivityType(type) {
    const map = {
      run: 'running',
      trail_run: 'trail_running',
      treadmill: 'treadmill',
      bike: 'cycling',
      mtb: 'cycling',
      walk: 'walking',
      hike: 'hiking',
      swim: 'swimming',
      strength: 'strength',
      cardio: 'cardio',
      yoga: 'yoga',
    };
    if (!type) return 'running';
    const key = type.toLowerCase().replace(/\s+/g, '_');
    return map[key] || 'other';
  }

  convertTrackPoints(points) {
    if (!Array.isArray(points) || points.length === 0) return null;
    return points.map(p => ({
      lat: p.latitude || p.lat,
      lng: p.longitude || p.lon || p.lng,
      elevation: p.elevation || p.altitude,
      timestamp: p.timestamp || p.time,
      heartrate: p.heart_rate || p.hr,
    }));
  }
}

export default CorosService;
