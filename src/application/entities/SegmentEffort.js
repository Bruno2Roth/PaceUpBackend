export class SegmentEffort {
  constructor({
    id,
    segmentId,
    activityId,
    userId,
    elapsedSeconds,
    movingSeconds,
    distanceM,
    avgSpeedMs,
    maxSpeedMs,
    avgHeartrate,
    startLat,
    startLng,
    endLat,
    endLng,
    isKom = false,
    rank,
    createdAt,
  }) {
    this.id = id;
    this.segmentId = segmentId;
    this.activityId = activityId;
    this.userId = userId;
    this.elapsedSeconds = elapsedSeconds;
    this.movingSeconds = movingSeconds;
    this.distanceM = distanceM;
    this.avgSpeedMs = avgSpeedMs;
    this.maxSpeedMs = maxSpeedMs;
    this.avgHeartrate = avgHeartrate;
    this.startLat = startLat;
    this.startLng = startLng;
    this.endLat = endLat;
    this.endLng = endLng;
    this.isKom = isKom;
    this.rank = rank;
    this.createdAt = createdAt;
  }
}

export default SegmentEffort;
