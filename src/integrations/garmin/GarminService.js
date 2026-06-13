import axios from 'axios';
import config from '../../configs/environment.js';
import { generateState, buildAuthorizationUrl, exchangeCode, refreshAccessToken, isTokenExpired } from '../../helpers/oauth2.js';

const PROVIDER = 'garmin';
const API_BASE = config.garmin.apiUrl || 'https://connectapi.garmin.com';
const AUTH_BASE = 'https://connect.garmin.com/oauth';

export class GarminService {
  constructor() {}

  getAuthorizationUrl(state) {
    const params = {
      response_type: 'code',
      client_id: config.garmin.clientId,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/garmin/callback`,
      scope: 'activity:read_all heartrate:read_all profile:read_all',
      state,
    };
    return buildAuthorizationUrl(`${AUTH_BASE}/authorize`, params);
  }

  async exchangeCodeForToken(code) {
    const data = {
      grant_type: 'authorization_code',
      client_id: config.garmin.clientId,
      client_secret: config.garmin.clientSecret,
      code,
      redirect_uri: `${config.apiBaseUrl}/api/${config.apiVersion}/integrations/garmin/callback`,
    };
    const result = await exchangeCode(`${API_BASE}/oauth/token`, data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      token_type: result.token_type,
      scope: result.scope,
      provider_user_id: result.user_id?.toString(),
      provider_username: result.username,
    };
  }

  async refreshAccessToken(refreshToken) {
    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.garmin.clientId,
      client_secret: config.garmin.clientSecret,
    };
    const result = await refreshAccessToken(`${API_BASE}/oauth/token`, data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token || refreshToken,
      expires_in: result.expires_in,
      token_type: result.token_type,
    };
  }

  async fetchUserProfile(accessToken) {
    const response = await axios.get(`${API_BASE}/userprofile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async fetchActivities(accessToken, startDate, endDate) {
    const params = { start: 0, limit: 100 };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axios.get(`${API_BASE}/activitylist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    return response.data || [];
  }

  async fetchActivityDetails(accessToken, activityId) {
    const response = await axios.get(`${API_BASE}/activity/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async fetchActivitySplits(accessToken, activityId) {
    const response = await axios.get(`${API_BASE}/activity/${activityId}/splits`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  convertActivity(garminActivity) {
    const startTime = garminActivity.startTimeGMT || garminActivity.startTimeLocal;
    const endTime = garminActivity.endTimeGMT || garminActivity.endTimeLocal;

    const activityType = this.mapActivityType(garminActivity.activityType?.typeKey || garminActivity.activityType?.typeId);

    let gpsData = null;
    if (garminActivity.geoPolylineDTO?.polyline) {
      gpsData = this.decodePolyline(garminActivity.geoPolylineDTO.polyline);
    }

    return {
      title: garminActivity.activityName || `${activityType} - ${new Date(startTime).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: Math.round((garminActivity.distance || 0) * 1000),
      duration_seconds: garminActivity.duration || 0,
      start_time: startTime,
      end_time: endTime,
      elevation_gain_m: garminActivity.elevationGain || null,
      elevation_loss_m: garminActivity.elevationLoss || null,
      average_heartrate: garminActivity.averageHR || null,
      max_heartrate: garminActivity.maxHR || null,
      calories_burned: garminActivity.calories || null,
      average_speed_kmh: garminActivity.averageSpeed ? garminActivity.averageSpeed * 3.6 : null,
      max_speed_kmh: garminActivity.maxSpeed ? garminActivity.maxSpeed * 3.6 : null,
      gps_data: gpsData,
      is_workout: true,
      source: 'garmin',
      source_id: garminActivity.activityId?.toString(),
    };
  }

  mapActivityType(garminType) {
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
      cardio: 'cardio',
      yoga: 'yoga',
      other: 'other',
    };
    if (!garminType) return 'running';
    const key = garminType.toLowerCase().replace(/\s+/g, '_');
    return map[key] || 'other';
  }

  decodePolyline(polyline) {
    if (!polyline || typeof polyline !== 'string') return null;
    try {
      const points = [];
      let index = 0;
      let lat = 0;
      let lng = 0;
      while (index < polyline.length) {
        let shift = 0;
        let result = 0;
        let byte;
        do {
          byte = polyline.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
          byte = polyline.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += deltaLng;
        points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
      }
      return points;
    } catch {
      return null;
    }
  }
}

export default GarminService;
