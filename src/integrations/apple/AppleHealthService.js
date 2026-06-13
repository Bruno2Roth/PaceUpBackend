export class AppleHealthService {
  async importData(userId, payload) {
    const { activities, metrics } = payload;
    const imported = [];

    if (Array.isArray(activities)) {
      for (const item of activities) {
        const activity = this.convertWorkout(item);
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

  convertWorkout(item) {
    if (!item.startDate) return null;
    const activityType = this.mapActivityType(item.workoutActivityType || item.type);
    return {
      type: 'activity',
      title: item.name || `${activityType} - ${new Date(item.startDate).toLocaleDateString()}`,
      activity_type: activityType,
      distance_m: item.totalDistance ? Math.round(parseFloat(item.totalDistance) * 1000) : 0,
      duration_seconds: item.duration ? Math.round(parseFloat(item.duration)) : 0,
      start_time: item.startDate,
      end_time: item.endDate || new Date(new Date(item.startDate).getTime() + (item.duration || 0) * 1000).toISOString(),
      elevation_gain_m: item.elevationAscended ? parseFloat(item.elevationAscended) : null,
      average_heartrate: item.averageHeartRate ? Math.round(parseFloat(item.averageHeartRate)) : null,
      max_heartrate: item.maxHeartRate ? Math.round(parseFloat(item.maxHeartRate)) : null,
      calories_burned: item.activeEnergyBurned ? Math.round(parseFloat(item.activeEnergyBurned)) : null,
      source: 'apple_health',
      source_id: item.uuid || null,
    };
  }

  convertMetric(item) {
    return {
      type: 'metric',
      metric_type: item.type || item.identifier,
      value: parseFloat(item.value) || 0,
      unit: item.unit || '',
      date: item.date || item.startDate,
      source: 'apple_health',
    };
  }

  mapActivityType(appleType) {
    const map = {
      running: 'running',
      outdoor_run: 'running',
      trail_running: 'trail_running',
      indoor_run: 'treadmill',
      cycling: 'cycling',
      outdoor_cycle: 'cycling',
      indoor_cycle: 'cycling',
      walking: 'walking',
      outdoor_walk: 'walking',
      hiking: 'hiking',
      swimming: 'swimming',
      open_water_swim: 'swimming',
      pool_swim: 'swimming',
      strength: 'strength',
      traditional_strength_training: 'strength',
      cardio: 'cardio',
      yoga: 'yoga',
      mind_and_body: 'yoga',
    };
    if (!appleType) return 'running';
    const key = appleType.toLowerCase().replace(/[\s_]+/g, '_');
    return map[key] || 'other';
  }
}

export default AppleHealthService;
