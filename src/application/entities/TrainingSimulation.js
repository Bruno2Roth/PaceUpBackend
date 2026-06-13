export class TrainingSimulation {
  constructor({
    id,
    userId,
    name,
    weeks,
    weeklyDistance,
    weeklyFrequency,
    targetDistance,
    predictedImprovement,
    fatigueEstimates,
    metadata,
    createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.weeks = weeks;
    this.weeklyDistance = weeklyDistance;
    this.weeklyFrequency = weeklyFrequency;
    this.targetDistance = targetDistance;
    this.predictedImprovement = predictedImprovement;
    this.fatigueEstimates = fatigueEstimates;
    this.metadata = metadata;
    this.createdAt = createdAt;
  }
}

export default TrainingSimulation;
