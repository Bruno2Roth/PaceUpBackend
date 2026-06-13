export class RacePrediction {
  constructor({
    id,
    userId,
    distance,
    predictedSeconds,
    confidence,
    basedOnActivities,
    basedOnV02max,
    createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.distance = distance;
    this.predictedSeconds = predictedSeconds;
    this.confidence = confidence;
    this.basedOnActivities = basedOnActivities;
    this.basedOnV02max = basedOnV02max;
    this.createdAt = createdAt;
  }
}

export default RacePrediction;
