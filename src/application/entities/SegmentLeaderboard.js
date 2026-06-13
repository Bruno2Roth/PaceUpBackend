export class SegmentLeaderboard {
  constructor({
    id,
    segmentId,
    userId,
    bestEffortId,
    elapsedSeconds,
    rank,
    isKom = false,
    isQom = false,
    isCourseRecord = false,
    dateSet,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.segmentId = segmentId;
    this.userId = userId;
    this.bestEffortId = bestEffortId;
    this.elapsedSeconds = elapsedSeconds;
    this.rank = rank;
    this.isKom = isKom;
    this.isQom = isQom;
    this.isCourseRecord = isCourseRecord;
    this.dateSet = dateSet;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default SegmentLeaderboard;
