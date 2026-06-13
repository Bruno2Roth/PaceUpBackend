export class UserDailyActivity {
  constructor({
    id,
    userId,
    date,
    isActive,
    sessionCount,
    activityCount,
    distanceKm,
    createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.date = date;
    this.isActive = isActive;
    this.sessionCount = sessionCount;
    this.activityCount = activityCount;
    this.distanceKm = distanceKm;
    this.createdAt = createdAt;
  }
}

export default UserDailyActivity;
