export class Activity {
  constructor({
    id,
    userId,
    title,
    description,
    activityType = 'running',
    distance_m,
    duration_seconds,
    pace_per_km,
    average_speed_kmh,
    max_speed_kmh,
    elevation_gain_m,
    elevation_loss_m,
    calories_burned,
    average_heartrate,
    max_heartrate,
    start_time,
    end_time,
    route_id,
    club_id,
    gps_data,
    weather_data,
    is_private = false,
    is_race = false,
    is_workout = false,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.activityType = activityType;
    this.distance_m = distance_m;
    this.duration_seconds = duration_seconds;
    this.pace_per_km = pace_per_km;
    this.average_speed_kmh = average_speed_kmh;
    this.max_speed_kmh = max_speed_kmh;
    this.elevation_gain_m = elevation_gain_m;
    this.elevation_loss_m = elevation_loss_m;
    this.calories_burned = calories_burned;
    this.average_heartrate = average_heartrate;
    this.max_heartrate = max_heartrate;
    this.start_time = start_time;
    this.end_time = end_time;
    this.route_id = route_id;
    this.club_id = club_id;
    this.gps_data = gps_data;
    this.weather_data = weather_data;
    this.is_private = is_private;
    this.is_race = is_race;
    this.is_workout = is_workout;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }

  getDurationMinutes() {
    return Math.round(this.duration_seconds / 60);
  }

  getFormattedDuration() {
    const hours = Math.floor(this.duration_seconds / 3600);
    const minutes = Math.floor((this.duration_seconds % 3600) / 60);
    const seconds = this.duration_seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  isRunning() {
    return this.activityType === 'running';
  }

  isTrailRunning() {
    return this.activityType === 'trail_running';
  }

  isTreadmill() {
    return this.activityType === 'treadmill';
  }
}

export default Activity;
