export class Segment {
  constructor({ id, name, description, segmentType, city, country, distanceM, elevationGain, elevationLoss, avgGrade, startLat, startLng, endLat, endLng, polyline, activityCount, effortCount, creatorId, isPrivate, isDeleted, createdAt, updatedAt }) {
    this.id = id; this.name = name; this.description = description; this.segmentType = segmentType;
    this.city = city; this.country = country; this.distanceM = distanceM; this.elevationGain = elevationGain;
    this.elevationLoss = elevationLoss; this.avgGrade = avgGrade; this.startLat = startLat; this.startLng = startLng;
    this.endLat = endLat; this.endLng = endLng; this.polyline = polyline; this.activityCount = activityCount;
    this.effortCount = effortCount; this.creatorId = creatorId; this.isPrivate = isPrivate; this.isDeleted = isDeleted;
    this.createdAt = createdAt; this.updatedAt = updatedAt;
  }
}
export default Segment;
