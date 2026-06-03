export class Route {
  constructor({
    id,
    user_id,
    name,
    description,
    distance_m,
    elevation_gain_m,
    elevation_loss_m,
    difficulty_level = 'moderate',
    gps_points,
    map_preview_url,
    is_public = true,
    activity_count = 0,
    average_time_seconds,
    best_time_seconds,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.description = description;
    this.distance_m = distance_m;
    this.elevation_gain_m = elevation_gain_m;
    this.elevation_loss_m = elevation_loss_m;
    this.difficulty_level = difficulty_level;
    this.gps_points = gps_points;
    this.map_preview_url = map_preview_url;
    this.is_public = is_public;
    this.activity_count = activity_count;
    this.average_time_seconds = average_time_seconds;
    this.best_time_seconds = best_time_seconds;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }

  isEasy() {
    return this.difficulty_level === 'easy';
  }

  isModerate() {
    return this.difficulty_level === 'moderate';
  }

  isHard() {
    return this.difficulty_level === 'hard';
  }

  getDistanceKm() {
    return this.distance_m / 1000;
  }
}

export default Route;
