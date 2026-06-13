import SegmentRepository from '../../data/repositories/SegmentRepository.js';
import SegmentEffortRepository from '../../data/repositories/SegmentEffortRepository.js';
import SegmentLeaderboardRepository from '../../data/repositories/SegmentLeaderboardRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import NotificationService from './NotificationService.js';

const COORD_TOLERANCE_KM = 0.05;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180))
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class SegmentService {
  constructor() {
    this.segmentRepository = new SegmentRepository();
    this.segmentEffortRepository = new SegmentEffortRepository();
    this.segmentLeaderboardRepository = new SegmentLeaderboardRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
  }

  async create(data, userId) {
    const segment = await this.segmentRepository.create({
      name: data.name,
      description: data.description || null,
      segment_type: data.segmentType || 'running',
      city: data.city || null,
      country: data.country || null,
      distance_m: data.distanceM || 0,
      elevation_gain: data.elevationGain || 0,
      elevation_loss: data.elevationLoss || 0,
      avg_grade: data.avgGrade || 0,
      start_lat: data.startLat,
      start_lng: data.startLng,
      end_lat: data.endLat,
      end_lng: data.endLng,
      polyline: data.polyline || null,
      creator_id: userId,
      is_private: data.isPrivate || false,
      activity_count: 0,
      effort_count: 0,
    });
    return segment;
  }

  async getById(id) {
    const segment = await this.segmentRepository.findNonDeletedById(id);
    if (!segment) {
      const err = new Error('Segment not found');
      err.status = 404;
      throw err;
    }
    return segment;
  }

  async list(query = {}) {
    const { type, nearLat, nearLng, radiusKm = 10, limit = 20, offset = 0 } = query;

    if (nearLat && nearLng) {
      return this.segmentRepository.findNearby(
        parseFloat(nearLat), parseFloat(nearLng),
        parseFloat(radiusKm), parseInt(limit, 10), parseInt(offset, 10),
      );
    }

    if (type) {
      return this.segmentRepository.findByType(type, parseInt(limit, 10), parseInt(offset, 10));
    }

    return this.segmentRepository.findAll(parseInt(limit, 10), parseInt(offset, 10), 'is_deleted = FALSE');
  }

  async update(id, data, userId) {
    const segment = await this.segmentRepository.findNonDeletedById(id);
    if (!segment) {
      const err = new Error('Segment not found');
      err.status = 404;
      throw err;
    }
    if (segment.creator_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    return this.segmentRepository.update(id, {
      name: data.name ?? segment.name,
      description: data.description ?? segment.description,
      segment_type: data.segmentType ?? segment.segment_type,
      city: data.city ?? segment.city,
      country: data.country ?? segment.country,
      distance_m: data.distanceM ?? segment.distance_m,
      elevation_gain: data.elevationGain ?? segment.elevation_gain,
      elevation_loss: data.elevationLoss ?? segment.elevation_loss,
      avg_grade: data.avgGrade ?? segment.avg_grade,
      polyline: data.polyline ?? segment.polyline,
      is_private: data.isPrivate !== undefined ? data.isPrivate : segment.is_private,
    });
  }

  async delete(id, userId) {
    const segment = await this.segmentRepository.findNonDeletedById(id);
    if (!segment) {
      const err = new Error('Segment not found');
      err.status = 404;
      throw err;
    }
    if (segment.creator_id !== userId) {
      const err = new Error('Unauthorized');
      err.status = 403;
      throw err;
    }

    return this.segmentRepository.softDelete(id);
  }

  async detectEffort(activity) {
    const gpsData = activity.gps_data;
    if (!Array.isArray(gpsData) || gpsData.length < 2) {
      return [];
    }

    const detectedEfforts = [];
    const allSegments = await this.segmentRepository.findAll(
      1000, 0, 'is_deleted = FALSE AND is_private = FALSE',
    );

    const activityStart = { lat: parseFloat(gpsData[0].lat), lng: parseFloat(gpsData[0].lng) };
    const activityEnd = { lat: parseFloat(gpsData[gpsData.length - 1].lat), lng: parseFloat(gpsData[gpsData.length - 1].lng) };

    for (const segment of allSegments) {
      const startDist = haversineKm(
        activityStart.lat, activityStart.lng,
        parseFloat(segment.start_lat), parseFloat(segment.start_lng),
      );
      const endDist = haversineKm(
        activityEnd.lat, activityEnd.lng,
        parseFloat(segment.end_lat), parseFloat(segment.end_lng),
      );

      if (startDist <= COORD_TOLERANCE_KM && endDist <= COORD_TOLERANCE_KM) {
        const elapsedSeconds = activity.duration_seconds || 0;
        const distanceM = activity.distance_m || segment.distance_m;
        const avgSpeedMs = elapsedSeconds > 0 ? distanceM / elapsedSeconds : 0;

        const existingEfforts = await this.segmentEffortRepository.findByUserAndSegment(
          activity.user_id, segment.id,
        );

        if (existingEfforts.length > 0) {
          const best = existingEfforts.reduce((a, b) =>
            a.elapsed_seconds < b.elapsed_seconds ? a : b,
          );
          if (elapsedSeconds >= best.elapsed_seconds) {
            continue;
          }
        }

        const effort = await this.segmentEffortRepository.create({
          segment_id: segment.id,
          activity_id: activity.id,
          user_id: activity.user_id,
          elapsed_seconds: elapsedSeconds,
          moving_seconds: activity.duration_seconds || null,
          distance_m: distanceM,
          avg_speed_ms: parseFloat(avgSpeedMs.toFixed(2)),
          max_speed_ms: activity.max_speed_kmh ? parseFloat((activity.max_speed_kmh / 3.6).toFixed(2)) : null,
          avg_heartrate: activity.average_heartrate || null,
          start_lat: segment.start_lat,
          start_lng: segment.start_lng,
          end_lat: segment.end_lat,
          end_lng: segment.end_lng,
        });

        await this.segmentRepository.incrementEffortCount(segment.id);

        await this._updateKOM(segment.id);

        detectedEfforts.push(effort);
      }
    }

    return detectedEfforts;
  }

  async _updateKOM(segmentId) {
    const allEfforts = await this.segmentEffortRepository.findBySegment(segmentId, 200, 0);
    if (allEfforts.length === 0) return;

    const bestEffort = allEfforts.reduce((a, b) =>
      parseFloat(a.elapsed_seconds) < parseFloat(b.elapsed_seconds) ? a : b,
    );

    const maleEfforts = [];
    const femaleEfforts = [];

    for (const e of allEfforts) {
      const user = await this.userRepository.findNonDeletedById(e.user_id);
      if (user && user.gender === 'male') maleEfforts.push(e);
      else if (user && user.gender === 'female') femaleEfforts.push(e);
    }

    const bestMale = maleEfforts.length > 0
      ? maleEfforts.reduce((a, b) => parseFloat(a.elapsed_seconds) < parseFloat(b.elapsed_seconds) ? a : b)
      : null;
    const bestFemale = femaleEfforts.length > 0
      ? femaleEfforts.reduce((a, b) => parseFloat(a.elapsed_seconds) < parseFloat(b.elapsed_seconds) ? a : b)
      : null;

    await this.segmentLeaderboardRepository.clearKOM(segmentId);

    for (const e of allEfforts) {
      const existing = await this.segmentLeaderboardRepository.findBySegmentAndUser(segmentId, e.user_id);

      const entryData = {
        segment_id: segmentId,
        user_id: e.user_id,
        best_effort_id: e.id,
        elapsed_seconds: e.elapsed_seconds,
        rank: 0,
        is_kom: bestMale && e.id === bestMale.id,
        is_qom: bestFemale && e.id === bestFemale.id,
        is_course_record: e.id === bestEffort.id,
        date_set: e.created_at,
      };

      if (existing) {
        await this.segmentLeaderboardRepository.update(existing.id, {
          best_effort_id: e.id,
          elapsed_seconds: e.elapsed_seconds,
          is_kom: entryData.is_kom,
          is_qom: entryData.is_qom,
          is_course_record: entryData.is_course_record,
          date_set: entryData.date_set,
        });
      } else {
        await this.segmentLeaderboardRepository.create(entryData);
      }
    }

    await this.segmentLeaderboardRepository.updateRankings(segmentId);

    const previousKOM = await this.segmentLeaderboardRepository.getKOM(segmentId);
    if (previousKOM && bestMale && previousKOM.user_id !== bestMale.user_id) {
      await this.notificationService.createNotification({
        userId: previousKOM.user_id,
        type: 'kom_lost',
        title: 'KOM perdido',
        message: 'Alguien ha batido tu KOM en un segmento',
        metadata: { segment_id: segmentId },
      });
      await this.notificationService.createNotification({
        userId: bestMale.user_id,
        type: 'kom_earned',
        title: 'Nuevo KOM',
        message: 'Has conseguido el KOM en un segmento',
        metadata: { segment_id: segmentId },
      });
    }

    const previousQOM = await this.segmentLeaderboardRepository.getQOM(segmentId);
    if (previousQOM && bestFemale && previousQOM.user_id !== bestFemale.user_id) {
      await this.notificationService.createNotification({
        userId: previousQOM.user_id,
        type: 'qom_lost',
        title: 'QOM perdido',
        message: 'Alguien ha batido tu QOM en un segmento',
        metadata: { segment_id: segmentId },
      });
      await this.notificationService.createNotification({
        userId: bestFemale.user_id,
        type: 'qom_earned',
        title: 'Nuevo QOM',
        message: 'Has conseguido el QOM en un segmento',
        metadata: { segment_id: segmentId },
      });
    }
  }

  async getLeaderboard(segmentId, limit = 50) {
    const segment = await this.segmentRepository.findNonDeletedById(segmentId);
    if (!segment) {
      const err = new Error('Segment not found');
      err.status = 404;
      throw err;
    }
    return this.segmentLeaderboardRepository.findBySegment(segmentId, limit);
  }

  async getEfforts(segmentId, userId, limit = 50) {
    const segment = await this.segmentRepository.findNonDeletedById(segmentId);
    if (!segment) {
      const err = new Error('Segment not found');
      err.status = 404;
      throw err;
    }

    if (userId) {
      return this.segmentEffortRepository.findByUserAndSegment(userId, segmentId);
    }

    return this.segmentEffortRepository.findBySegment(segmentId, limit);
  }
}

export default SegmentService;
