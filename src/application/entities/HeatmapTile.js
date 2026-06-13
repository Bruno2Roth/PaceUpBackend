export class HeatmapTile {
  constructor({
    id, userId, clubId, tileKey, zoomLevel,
    xCoord, yCoord, intensity, gpsPoints,
    calculatedAt, createdAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.clubId = clubId;
    this.tileKey = tileKey;
    this.zoomLevel = zoomLevel;
    this.xCoord = xCoord;
    this.yCoord = yCoord;
    this.intensity = intensity;
    this.gpsPoints = gpsPoints;
    this.calculatedAt = calculatedAt;
    this.createdAt = createdAt;
  }
}

export default HeatmapTile;
