import BaseRepository from './BaseRepository.js';

export class HeatmapRepository extends BaseRepository {
  constructor() {
    super('heatmap_tiles');
  }

  async findByUserTile(userId, zoomLevel, xCoord, yCoord) {
    const query = `
      SELECT * FROM heatmap_tiles
      WHERE user_id = $1 AND zoom_level = $2 AND x_coord = $3 AND y_coord = $4
    `;
    const result = await this.pool.query(query, [userId, zoomLevel, xCoord, yCoord]);
    return result.rows[0];
  }

  async findByUserZoom(userId, zoomLevel) {
    const query = `
      SELECT * FROM heatmap_tiles
      WHERE user_id = $1 AND zoom_level = $2
      ORDER BY intensity DESC
    `;
    const result = await this.pool.query(query, [userId, zoomLevel]);
    return result.rows;
  }

  async findByClubZoom(clubId, zoomLevel) {
    const query = `
      SELECT ht.* FROM heatmap_tiles ht
      INNER JOIN club_members cm ON ht.user_id = cm.user_id
      WHERE cm.club_id = $1 AND ht.zoom_level = $2
      ORDER BY ht.intensity DESC
    `;
    const result = await this.pool.query(query, [clubId, zoomLevel]);
    return result.rows;
  }

  async findGlobalZoom(zoomLevel) {
    const query = `
      SELECT * FROM heatmap_tiles
      WHERE club_id IS NULL AND zoom_level = $1
      ORDER BY intensity DESC
    `;
    const result = await this.pool.query(query, [zoomLevel]);
    return result.rows;
  }

  async upsertTile(userId, tileKey, zoomLevel, xCoord, yCoord, intensity, gpsPoints) {
    const query = `
      INSERT INTO heatmap_tiles (user_id, tile_key, zoom_level, x_coord, y_coord, intensity, gps_points)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, tile_key) DO UPDATE SET
        intensity = heatmap_tiles.intensity + $6,
        gps_points = EXCLUDED.gps_points,
        calculated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, tileKey, zoomLevel, xCoord, yCoord, intensity, JSON.stringify(gpsPoints)]);
    return result.rows[0];
  }

  async getUserGPSCoordinates(userId, sinceDate) {
    const query = `
      SELECT gps_data, start_time FROM activities
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND gps_data IS NOT NULL
        AND start_time >= $2
      ORDER BY start_time ASC
    `;
    const result = await this.pool.query(query, [userId, sinceDate]);
    return result.rows;
  }

  async getClubGPSCoordinates(clubId, sinceDate) {
    const query = `
      SELECT a.gps_data, a.user_id, a.start_time FROM activities a
      INNER JOIN club_members cm ON a.user_id = cm.user_id
      WHERE cm.club_id = $1
        AND a.deleted_at IS NULL
        AND a.gps_data IS NOT NULL
        AND a.is_private = FALSE
        AND a.start_time >= $2
      ORDER BY a.start_time ASC
    `;
    const result = await this.pool.query(query, [clubId, sinceDate]);
    return result.rows;
  }

  async getGlobalGPSCoordinates(sinceDate) {
    const query = `
      SELECT gps_data, user_id, start_time FROM activities
      WHERE deleted_at IS NULL
        AND gps_data IS NOT NULL
        AND is_private = FALSE
        AND start_time >= $1
      ORDER BY start_time ASC
    `;
    const result = await this.pool.query(query, [sinceDate]);
    return result.rows;
  }

  async clearUserTiles(userId) {
    const query = 'DELETE FROM heatmap_tiles WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }
}

export default HeatmapRepository;
