export class Segment {
  constructor({
    id,
    route_id,
    name,
    description,
    distance_m,
    elevation_gain_m,
    elevation_loss_m,
    start_point,
    end_point,
    gps_points,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.route_id = route_id;
    this.name = name;
    this.description = description;
    this.distance_m = distance_m;
    this.elevation_gain_m = elevation_gain_m;
    this.elevation_loss_m = elevation_loss_m;
    this.start_point = start_point;
    this.end_point = end_point;
    this.gps_points = gps_points;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }

  getDistanceKm() {
    return this.distance_m / 1000;
  }
}

export default Segment;
