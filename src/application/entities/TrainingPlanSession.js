export class TrainingPlanSession {
  constructor({
    id, weekId, dayOfWeek, sessionType, description,
    distanceGoal, durationGoal, paceGoalMin, paceGoalMax,
    isCompleted, completedDistance, completedDuration,
    notes, createdAt, updatedAt,
  }) {
    this.id = id;
    this.weekId = weekId;
    this.dayOfWeek = dayOfWeek;
    this.sessionType = sessionType;
    this.description = description;
    this.distanceGoal = distanceGoal;
    this.durationGoal = durationGoal;
    this.paceGoalMin = paceGoalMin;
    this.paceGoalMax = paceGoalMax;
    this.isCompleted = isCompleted;
    this.completedDistance = completedDistance;
    this.completedDuration = completedDuration;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default TrainingPlanSession;
