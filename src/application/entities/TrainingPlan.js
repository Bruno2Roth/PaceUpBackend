export class TrainingPlan {
  constructor({
    id, userId, goal, level, startDate, endDate,
    isActive, isPaused, weekCount, metadata,
    createdAt, updatedAt, deletedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.goal = goal;
    this.level = level;
    this.startDate = startDate;
    this.endDate = endDate;
    this.isActive = isActive;
    this.isPaused = isPaused;
    this.weekCount = weekCount;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}

export default TrainingPlan;
