import axios from 'axios';
import config from '../../configs/environment.js';
import { generateState, buildAuthorizationUrl, exchangeCode, refreshAccessToken, isTokenExpired } from '../../helpers/oauth2.js';

const PROVIDER = 'suunto';
const API_BASE = config.suunto.apiUrl || 'https://api.suunto.com';
const AUTH_BASE = 'https://cloudapi.suunto.com';

export class SuuntoService {
  constructor() {}

  getAuthorizationUrl(state) {
    const params = {
      response_type: 'code',
      client_id: config.suunto.apiKey,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/suunto/callback`,
      scope: 'user:read workout:read',
      state,
    };
    return buildAuthorizationUrl(`${AUTH_BASE}/oauth/authorize`, params);
  }

  async exchangeCodeForToken(code) {
    const data = {
      grant_type: 'authorization_code',
      client_id: config.suunto.apiKey,
      client_secret: config.suunto.clientSecret,
      code,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/suunto/callback`,
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
      client_id: config.suunto.apiKey,
      client_secret: config.suunto.clientSecret,
    };
    const result = await refreshAccessToken(`${AUTH_BASE}/oauth/token`, data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token || refreshToken,
      expires_in: result.expires_in,
    };
  }

  async fetchActivities(accessToken, startDate, endDate) {
    const params = { limit: 100, offset: 0 };
    if (startDate) params.from = startDate;
    if (endDate) params.to = endDate;
    const response = await axios.get(`${API_BASE}/v1/workouts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    return response.data?.data || response.data || [];
  }

  async fetchActivityDetails(accessToken, workoutId) {
    const response = await axios.get(`${API_BASE}/v1/workouts/${workoutId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  convertActivity(suuntoActivity) {
    const activityType = this.mapActivityType(suuntoActivity.sport || suuntoActivity.type);
    return {
      title: suuntoActivity.name || `${activityType} - ${new Date(suuntoActivity.start_time).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: Math.round((suuntoActivity.distance || 0) * 1000),
      duration_seconds: suuntoActivity.duration || suuntoActivity.elapsed_time || 0,
      start_time: suuntoActivity.start_time,
      end_time: suuntoActivity.end_time,
      elevation_gain_m: suuntoActivity.ascent || null,
      elevation_loss_m: suuntoActivity.descent || null,
      average_heartrate: suuntoActivity.avg_hr || null,
      max_heartrate: suuntoActivity.max_hr || null,
      calories_burned: suuntoActivity.calories || null,
      average_speed_kmh: suuntoActivity.avg_speed || null,
      max_speed_kmh: suuntoActivity.max_speed || null,
      gps_data: suuntoActivity.track ? this.convertTrack(suuntoActivity.track) : null,
      is_workout: true,
      source: 'suunto',
      source_id: suuntoActivity.id?.toString(),
    };
  }

  mapActivityType(type) {
    const map = {
      running: 'running',
      trail: 'trail_running',
      trail_running: 'trail_running',
      treadmill: 'treadmill',
      cycling: 'cycling',
      mountain_biking: 'cycling',
      walking: 'walking',
      hiking: 'hiking',
      swimming: 'swimming',
      strength: 'strength',
      cardio: 'cardio',
      yoga: 'yoga',
    };
    if (!type) return 'running';
    const key = type.toLowerCase().replace(/\s+/g, '_');
    return map[key] || 'other';
  }

  convertTrack(track) {
    if (!Array.isArray(track) || track.length === 0) return null;
    return track.map(p => ({
      lat: p.latitude || p.lat,
      lng: p.longitude || p.lng,
      elevation: p.altitude || p.elevation,
      timestamp: p.time || p.timestamp,
      heartrate: p.heart_rate || p.hr,
    }));
  }
}

export default SuuntoService;
