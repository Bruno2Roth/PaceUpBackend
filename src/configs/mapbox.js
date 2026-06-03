import config from './environment.js';

export const mapboxConfig = {
  token: config.mapbox.token,
  baseUrl: 'https://api.mapbox.com',
};

export const getMapboxDirectionUrl = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    throw new Error('At least 2 coordinates are required');
  }

  const coords = coordinates.map((c) => `${c.lon},${c.lat}`).join(';');
  return `${mapboxConfig.baseUrl}/directions/v5/mapbox/walking/${coords}?access_token=${mapboxConfig.token}`;
};

export const getMapboxTilesUrl = (tileset, z, x, y) => {
  return `${mapboxConfig.baseUrl}/v4/${tileset}/${z}/${x}/${y}.png?access_token=${mapboxConfig.token}`;
};

export const encodeLocation = (location) => {
  return encodeURIComponent(location);
};

export const geocodeAddress = async (address) => {
  // This will be implemented when Mapbox API calls are needed
  // Placeholder for future geocoding functionality
  return null;
};

export default {
  mapboxConfig,
  getMapboxDirectionUrl,
  getMapboxTilesUrl,
  encodeLocation,
  geocodeAddress,
};
