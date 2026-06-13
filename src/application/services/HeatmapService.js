import HeatmapRepository from '../../data/repositories/HeatmapRepository.js';
import redis from '../../configs/redis.js';

const HEATMAP_CACHE_PREFIX = 'heatmap:';
const HEATMAP_CACHE_TTL = 600;

export class HeatmapService {
  constructor() {
    this.heatmapRepository = new HeatmapRepository();
  }

  async getPersonalHeatmap(userId, zoomLevel = 14) {
    const cacheKey = `${HEATMAP_CACHE_PREFIX}personal:${userId}:${zoomLevel}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const tiles = await this.heatmapRepository.findByUserZoom(userId, zoomLevel);
    await redis.set(cacheKey, tiles, HEATMAP_CACHE_TTL);

    return {
      type: 'personal',
      user_id: userId,
      zoom: zoomLevel,
      tiles: tiles.map(t => ({
        x: t.x_coord,
        y: t.y_coord,
        intensity: t.intensity,
      })),
    };
  }

  async getClubHeatmap(clubId, zoomLevel = 14) {
    const cacheKey = `${HEATMAP_CACHE_PREFIX}club:${clubId}:${zoomLevel}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const tiles = await this.heatmapRepository.findByClubZoom(clubId, zoomLevel);
    await redis.set(cacheKey, tiles, HEATMAP_CACHE_TTL);

    return {
      type: 'club',
      club_id: clubId,
      zoom: zoomLevel,
      tiles: tiles.map(t => ({
        x: t.x_coord,
        y: t.y_coord,
        intensity: t.intensity,
      })),
    };
  }

  async getGlobalHeatmap(zoomLevel = 14) {
    const cacheKey = `${HEATMAP_CACHE_PREFIX}global:${zoomLevel}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const tiles = await this.heatmapRepository.findGlobalZoom(zoomLevel);
    await redis.set(cacheKey, tiles, HEATMAP_CACHE_TTL * 2);

    return {
      type: 'global',
      zoom: zoomLevel,
      tiles: tiles.map(t => ({
        x: t.x_coord,
        y: t.y_coord,
        intensity: t.intensity,
      })),
    };
  }

  async generatePersonalHeatmap(userId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activities = await this.heatmapRepository.getUserGPSCoordinates(userId, sixMonthsAgo.toISOString());

    await this.heatmapRepository.clearUserTiles(userId);

    for (const activity of activities) {
      if (!activity.gps_data) continue;

      let points;
      try {
        points = typeof activity.gps_data === 'string'
          ? JSON.parse(activity.gps_data)
          : activity.gps_data;
      } catch {
        continue;
      }

      if (!Array.isArray(points)) continue;

      for (const point of points) {
        if (!point.lat || !point.lng) continue;

        for (let zoom = 10; zoom <= 15; zoom++) {
          const tile = this.latLngToTile(point.lat, point.lng, zoom);
          const tileKey = `${userId}:${zoom}:${tile.x}:${tile.y}`;

          await this.heatmapRepository.upsertTile(
            userId, tileKey, zoom, tile.x, tile.y, 1, [point]
          );
        }
      }
    }

    const cacheKey = `${HEATMAP_CACHE_PREFIX}personal:${userId}:`;
    await redis.delete(cacheKey);

    return { message: 'Heatmap generated', user_id: userId };
  }

  latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }
}

export default HeatmapService;
