export class TrainingPlanWeek {
  constructor({
    id, planId, weekNumber, totalDistance,
    totalDuration, description, createdAt,
  }) {
    this.id = id;
    this.planId = planId;
    this.weekNumber = weekNumber;
    this.totalDistance = totalDistance;
    this.totalDuration = totalDuration;
    this.description = description;
    this.createdAt = createdAt;
  }
}

export default TrainingPlanWeek;
