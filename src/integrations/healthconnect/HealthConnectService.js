export class HealthConnectService {
  async importData(userId, payload) {
    const { activities, metrics } = payload;
    const imported = [];

    if (Array.isArray(activities)) {
      for (const item of activities) {
        const activity = this.convertSession(item);
        if (activity) imported.push(activity);
      }
    }

    if (Array.isArray(metrics)) {
      for (const item of metrics) {
        const metric = this.convertMetric(item);
        if (metric) imported.push(metric);
      }
    }

    return {
      activities_imported: imported.filter(a => a.type === 'activity').length,
      metrics_imported: imported.filter(a => a.type === 'metric').length,
      items: imported,
    };
  }

  convertSession(item) {
    if (!item.startTime && !item.start_date) return null;
    const startTime = item.startTime || item.start_date;
    const activityType = this.mapActivityType(item.exerciseType || item.type || item.activity_type);
    return {
      type: 'activity',
      title: item.name || `${activityType} - ${new Date(startTime).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: item.distance ? Math.round(parseFloat(item.distance) * 1000) : Math.round(parseFloat(item.distanceMeters || item.distance_m || 0)),
      duration_seconds: item.duration ? Math.round(parseFloat(item.duration)) : Math.round(parseFloat(item.durationSeconds || item.duration_seconds || 0)),
      start_time: startTime,
      end_time: item.endTime || item.end_time || new Date(new Date(startTime).getTime() + (item.duration || 0) * 1000).toISOString(),
      elevation_gain_m: item.elevationGain ? parseFloat(item.elevationGain) : (item.elevation_gain_m ? parseFloat(item.elevation_gain_m) : null),
      average_heartrate: item.averageHeartRate ? Math.round(parseFloat(item.averageHeartRate)) : (item.average_heartrate ? Math.round(parseFloat(item.average_heartrate)) : null),
      max_heartrate: item.maxHeartRate ? Math.round(parseFloat(item.maxHeartRate)) : (item.max_heartrate ? Math.round(parseFloat(item.max_heartrate)) : null),
      calories_burned: item.calories ? Math.round(parseFloat(item.calories)) : (item.calories_burned ? Math.round(parseFloat(item.calories_burned)) : null),
      gps_data: item.route || item.gps_data ? this.convertRoute(item.route || item.gps_data) : null,
      source: 'health_connect',
      source_id: item.id || item.uuid || null,
    };
  }

  convertMetric(item) {
    return {
      type: 'metric',
      metric_type: item.type || 'unknown',
      value: parseFloat(item.value) || 0,
      unit: item.unit || '',
      date: item.date || item.startTime || item.start_date,
      source: 'health_connect',
    };
  }

  mapActivityType(type) {
    const map = {
      running: 'running',
      outdoor_running: 'running',
      indoor_running: 'treadmill',
      running_treadmill: 'treadmill',
      trail_running: 'trail_running',
      cycling: 'cycling',
      outdoor_cycling: 'cycling',
      indoor_cycling: 'cycling',
      walking: 'walking',
      hiking: 'hiking',
      swimming: 'swimming',
      strength: 'strength',
      strength_training: 'strength',
      cardio: 'cardio',
      yoga: 'yoga',
    };
    if (!type) return 'running';
    const key = type.toLowerCase().replace(/[\s_-]+/g, '_');
    return map[key] || 'other';
  }

  convertRoute(route) {
    if (!Array.isArray(route) || route.length === 0) return null;
    return route.map(p => ({
      lat: parseFloat(p.latitude || p.lat || p.latitudeDegrees || 0),
      lng: parseFloat(p.longitude || p.lng || p.lon || p.longitudeDegrees || 0),
      elevation: p.elevation ? parseFloat(p.elevation) : null,
      timestamp: p.time || p.timestamp || null,
    }));
  }
}

export default HealthConnectService;
