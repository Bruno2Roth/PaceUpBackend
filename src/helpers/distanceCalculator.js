export const calculateDistance = (gpsPoints) => {
  // TODO: Calculate distance using Haversine formula
  // - Input: array of {lat, lon} objects
  // - Output: distance in meters
  if (!gpsPoints || gpsPoints.length < 2) {
    return 0;
  }

  const R = 6371000; // Earth radius in meters
  let totalDistance = 0;

  for (let i = 0; i < gpsPoints.length - 1; i++) {
    const point1 = gpsPoints[i];
    const point2 = gpsPoints[i + 1];

    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLon = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    totalDistance += distance;
  }

  return totalDistance;
};

export const calculatePace = (distanceMeters, durationSeconds) => {
  // TODO: Calculate pace in min/km format
  if (distanceMeters === 0 || durationSeconds === 0) {
    return 0;
  }

  const distanceKm = distanceMeters / 1000;
  const paceMinutes = durationSeconds / 60 / distanceKm;

  return parseFloat(paceMinutes.toFixed(2));
};

export const calculateAverageSpeed = (distanceMeters, durationSeconds) => {
  // TODO: Calculate average speed in km/h
  if (durationSeconds === 0) {
    return 0;
  }

  const distanceKm = distanceMeters / 1000;
  const hours = durationSeconds / 3600;
  const speed = distanceKm / hours;

  return parseFloat(speed.toFixed(2));
};

export const calculateElevation = (gpsPoints) => {
  // TODO: Calculate elevation gain and loss
  // - Requires elevation data in GPS points
  if (!gpsPoints || gpsPoints.length < 2) {
    return { gain: 0, loss: 0 };
  }

  let elevationGain = 0;
  let elevationLoss = 0;

  for (let i = 0; i < gpsPoints.length - 1; i++) {
    const point1 = gpsPoints[i];
    const point2 = gpsPoints[i + 1];

    if (point1.elevation && point2.elevation) {
      const diff = point2.elevation - point1.elevation;

      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }
  }

  return {
    gain: parseFloat(elevationGain.toFixed(2)),
    loss: parseFloat(elevationLoss.toFixed(2)),
  };
};

export const formatPaceString = (paceMinutes) => {
  // TODO: Format pace as MM:SS format
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.round((paceMinutes - minutes) * 60);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default {
  calculateDistance,
  calculatePace,
  calculateAverageSpeed,
  calculateElevation,
  formatPaceString,
};
