import RouteRepository from '../../data/repositories/RouteRepository.js';
import redis from '../../configs/redis.js';

const ROUTE_CACHE_PREFIX = 'routes:';
const ROUTE_CACHE_TTL = 300;
const ROUTE_CACHE_POPULAR_TTL = 600;

export class RouteService {
  constructor() {
    this.routeRepository = new RouteRepository();
  }

  async createRoute(userId, data) {
    const route = await this.routeRepository.create({
      user_id: userId,
      name: data.name || 'Sin nombre',
      description: data.description || null,
      distance_m: data.distance_m || 0,
      elevation_gain_m: data.elevation_gain_m || 0,
      elevation_loss_m: data.elevation_loss_m || 0,
      difficulty_level: data.difficulty_level || 'moderate',
      gps_points: data.gps_points ? JSON.stringify(data.gps_points) : null,
      map_preview_url: data.map_preview_url || null,
      is_public: data.is_public !== false,
      city: data.city || null,
      country: data.country || null,
      surface_type: data.surface_type || null,
    });

    await redis.delete(`${ROUTE_CACHE_PREFIX}user:${userId}`);
    return route;
  }

  async getRoutes(userId, query = {}) {
    const { public: isPublic, limit = 20, offset = 0 } = query;

    if (isPublic) {
      return this.routeRepository.findPublic(limit, offset);
    }

    if (userId) {
      return this.routeRepository.findByUserId(userId, limit, offset);
    }

    return this.routeRepository.findPublic(limit, offset);
  }

  async getRouteById(routeId) {
    const route = await this.routeRepository.findNonDeletedById(routeId);
    if (!route) {
      const err = new Error('Route not found');
      err.status = 404;
      throw err;
    }
    return route;
  }

  async updateRoute(routeId, userId, data) {
    const route = await this.routeRepository.findNonDeletedById(routeId);
    if (!route) {
      const err = new Error('Route not found');
      err.status = 404;
      throw err;
    }
    if (route.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const updated = await this.routeRepository.update(routeId, {
      name: data.name ?? route.name,
      description: data.description ?? route.description,
      distance_m: data.distance_m ?? route.distance_m,
      elevation_gain_m: data.elevation_gain_m ?? route.elevation_gain_m,
      elevation_loss_m: data.elevation_loss_m ?? route.elevation_loss_m,
      difficulty_level: data.difficulty_level ?? route.difficulty_level,
      gps_points: data.gps_points ? JSON.stringify(data.gps_points) : route.gps_points,
      is_public: data.is_public !== undefined ? data.is_public : route.is_public,
      is_favorite: data.is_favorite !== undefined ? data.is_favorite : route.is_favorite,
      city: data.city ?? route.city,
      country: data.country ?? route.country,
      surface_type: data.surface_type ?? route.surface_type,
    });

    await redis.delete(`${ROUTE_CACHE_PREFIX}user:${userId}`);
    return updated;
  }

  async deleteRoute(routeId, userId) {
    const route = await this.routeRepository.findNonDeletedById(routeId);
    if (!route) {
      const err = new Error('Route not found');
      err.status = 404;
      throw err;
    }
    if (route.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    await this.routeRepository.softDelete(routeId);
    await redis.delete(`${ROUTE_CACHE_PREFIX}user:${userId}`);
    return { message: 'Route deleted' };
  }

  async getPopularRoutes(limit = 20) {
    const cacheKey = `${ROUTE_CACHE_PREFIX}popular`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const routes = await this.routeRepository.findPopular(limit);
    await redis.set(cacheKey, routes, ROUTE_CACHE_POPULAR_TTL);
    return routes;
  }

  async getNearbyRoutes(lat, lng, radiusKm = 10, limit = 20) {
    return this.routeRepository.findNearby(lat, lng, radiusKm, limit);
  }

  async getFavoriteRoutes(userId, limit = 20, offset = 0) {
    return this.routeRepository.findFavorites(userId, limit, offset);
  }

  async toggleFavorite(routeId, userId) {
    const route = await this.routeRepository.findNonDeletedById(routeId);
    if (!route) {
      const err = new Error('Route not found');
      err.status = 404;
      throw err;
    }
    if (route.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    const updated = await this.routeRepository.update(routeId, {
      is_favorite: !route.is_favorite,
    });

    await redis.delete(`${ROUTE_CACHE_PREFIX}user:${userId}`);
    return updated;
  }
}

export default RouteService;
