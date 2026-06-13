export class Metric {
  constructor({
    id,
    userId,
    vo2Max,
    trainingLoad,
    acuteLoad,
    chronicLoad,
    fatigueScore,
    recoveryScore,
    fitnessScore,
    runningEfficiency,
    calculatedAt,
    createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.vo2Max = vo2Max;
    this.trainingLoad = trainingLoad;
    this.acuteLoad = acuteLoad;
    this.chronicLoad = chronicLoad;
    this.fatigueScore = fatigueScore;
    this.recoveryScore = recoveryScore;
    this.fitnessScore = fitnessScore;
    this.runningEfficiency = runningEfficiency;
    this.calculatedAt = calculatedAt;
    this.createdAt = createdAt;
  }
}

export default Metric;
