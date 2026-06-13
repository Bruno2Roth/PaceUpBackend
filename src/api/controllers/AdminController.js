import AdminService from '../../application/services/AdminService.js';
import AuditService from '../../application/services/AuditService.js';
import BackupService from '../../application/services/BackupService.js';
import SystemMetricsService from '../../application/services/SystemMetricsService.js';
import PrometheusService from '../../application/services/PrometheusService.js';
import ModerationService from '../../application/services/ModerationService.js';

export class AdminController {
  constructor() {
    this.adminService = new AdminService();
    this.auditService = new AuditService();
    this.backupService = new BackupService();
    this.metricsService = new SystemMetricsService();
    this.prometheusService = new PrometheusService();
    this.moderationService = new ModerationService();
  }

  async getMetrics(req, res, next) {
    try {
      const metrics = await this.metricsService.getMetrics();
      return res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async getHealth(req, res, next) {
    try {
      const dbStatus = await this.metricsService.getDbStatus();
      const redisStatus = await this.metricsService.getRedisStatus();
      const allHealthy = dbStatus.status === 'healthy' && redisStatus.status === 'healthy';
      return res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ok' : 'degraded',
        database: dbStatus.status,
        redis: redisStatus.status,
        uptime: Math.floor((Date.now() - this.metricsService.startTime) / 1000) || process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const system = await this.metricsService.getMetrics();
      return res.status(200).json({
        version: process.env.npm_package_version || '1.0.0',
        node: process.version,
        environment: process.env.NODE_ENV || 'development',
        ...system,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPrometheusMetrics(req, res, next) {
    try {
      const metrics = await this.prometheusService.getMetrics();
      res.setHeader('Content-Type', this.prometheusService.getContentType());
      return res.status(200).send(metrics);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const { limit = 20, offset = 0, role, search, is_banned, is_suspended } = req.query;
      const users = await this.adminService.listUsers(parseInt(limit), parseInt(offset), { role, search, is_banned, is_suspended });
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserDetail(req, res, next) {
    try {
      const user = await this.adminService.getUserDetail(parseInt(req.params.id));
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await this.adminService.updateUser(req.userId, parseInt(req.params.id), req.body);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await this.adminService.deleteUser(req.userId, parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listActivities(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const activities = await this.adminService.listActivities(parseInt(limit), parseInt(offset));
      return res.status(200).json(activities);
    } catch (error) {
      next(error);
    }
  }

  async deleteActivity(req, res, next) {
    try {
      const result = await this.adminService.deleteActivity(req.userId, parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const logs = await this.auditService.findAll(parseInt(limit), parseInt(offset));
      return res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogDetail(req, res, next) {
    try {
      const log = await this.auditService.findById(req.params.id);
      if (!log) return res.status(404).json({ error: 'Log not found' });
      return res.status(200).json(log);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const reports = await this.adminService.getReports();
      return res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  async getBackups(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const backups = await this.backupService.getBackupHistory(parseInt(limit));
      return res.status(200).json(backups);
    } catch (error) {
      next(error);
    }
  }

  async runBackup(req, res, next) {
    try {
      const result = await this.backupService.runPostgresBackup('manual');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getModerationReports(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const reports = await this.moderationService.getPendingReports(parseInt(limit), parseInt(offset));
      return res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req, res, next) {
    try {
      const { status } = req.body;
      const result = await this.moderationService.resolveReport(req.params.id, req.userId, status);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await this.moderationService.banUser(req.userId, parseInt(req.params.id), reason);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req, res, next) {
    try {
      const { reason, duration_hours } = req.body;
      const result = await this.moderationService.suspendUser(req.userId, parseInt(req.params.id), reason, duration_hours || 24);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const result = await this.moderationService.unbanUser(req.userId, parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unsuspendUser(req, res, next) {
    try {
      const result = await this.moderationService.unsuspendUser(req.userId, parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listSpecialBadges(req, res, next) {
    try {
      const badgeRepo = (await import('../../data/repositories/SpecialBadgeRepository.js')).default;
      const repo = new badgeRepo();
      const badges = await repo.findActive();
      return res.status(200).json(badges);
    } catch (error) {
      next(error);
    }
  }

  async createSpecialBadge(req, res, next) {
    try {
      const badgeRepo = (await import('../../data/repositories/SpecialBadgeRepository.js')).default;
      const repo = new badgeRepo();
      const badge = await repo.create(req.body);
      return res.status(201).json(badge);
    } catch (error) {
      next(error);
    }
  }

  async listSegments(req, res, next) {
    try {
      const segmentRepo = (await import('../../data/repositories/SegmentRepository.js')).default;
      const repo = new segmentRepo();
      const { limit = 20, offset = 0 } = req.query;
      const segments = await repo.findAll({ limit: parseInt(limit), offset: parseInt(offset) });
      return res.status(200).json(segments);
    } catch (error) {
      next(error);
    }
  }

  async deleteSegment(req, res, next) {
    try {
      const segmentRepo = (await import('../../data/repositories/SegmentRepository.js')).default;
      const repo = new segmentRepo();
      await repo.delete(parseInt(req.params.id));
      return res.status(200).json({ message: 'Segment deleted' });
    } catch (error) {
      next(error);
    }
  }

  async listEvents(req, res, next) {
    try {
      const eventRepo = (await import('../../data/repositories/EventRepository.js')).default;
      const repo = new eventRepo();
      const { limit = 20, offset = 0 } = req.query;
      const events = await repo.findAll({ limit: parseInt(limit), offset: parseInt(offset) });
      return res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const eventRepo = (await import('../../data/repositories/EventRepository.js')).default;
      const repo = new eventRepo();
      await repo.delete(parseInt(req.params.id));
      return res.status(200).json({ message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  }

  async listMarketplaceListings(req, res, next) {
    try {
      const marketplaceRepo = (await import('../../data/repositories/MarketplaceListingRepository.js')).default;
      const repo = new marketplaceRepo();
      const listings = await repo.findActive();
      return res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  }

  async deleteMarketplaceListing(req, res, next) {
    try {
      const marketplaceRepo = (await import('../../data/repositories/MarketplaceListingRepository.js')).default;
      const repo = new marketplaceRepo();
      await repo.update(parseInt(req.params.id), { is_active: false });
      return res.status(200).json({ message: 'Listing deactivated' });
    } catch (error) {
      next(error);
    }
  }

  async getSystemAnalytics(req, res, next) {
    try {
      const analyticsService = (await import('../../application/services/AnalyticsService.js')).default;
      const svc = new analyticsService();
      const today = new Date().toISOString().split('T')[0];
      const [dau, wau, mau] = await Promise.all([
        svc.getDAU(today),
        svc.getWAU(today),
        svc.getMAU(today),
      ]);
      return res.status(200).json({ dau, wau, mau });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
