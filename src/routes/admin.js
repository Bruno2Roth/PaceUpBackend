import { Router } from 'express';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import adminMiddleware from '../api/middlewares/adminMiddleware.js';
import AdminController from '../api/controllers/AdminController.js';
import AdminCommercialController from '../api/controllers/AdminCommercialController.js';
import { authRateLimit } from '../api/middlewares/rateLimitMiddleware.js';

const router = Router();
const controller = new AdminController();
const commercialController = new AdminCommercialController();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/metrics', controller.getMetrics.bind(controller));
router.get('/health', controller.getHealth.bind(controller));
router.get('/status', controller.getStatus.bind(controller));

router.get('/users', controller.listUsers.bind(controller));
router.get('/users/:id', controller.getUserDetail.bind(controller));
router.patch('/users/:id', controller.updateUser.bind(controller));
router.delete('/users/:id', controller.deleteUser.bind(controller));

router.get('/activities', controller.listActivities.bind(controller));
router.delete('/activities/:id', controller.deleteActivity.bind(controller));

router.get('/audit', controller.getAuditLogs.bind(controller));
router.get('/audit/:id', controller.getAuditLogDetail.bind(controller));

router.get('/reports', controller.getReports.bind(controller));

router.get('/backups', controller.getBackups.bind(controller));
router.post('/backups/run', controller.runBackup.bind(controller));

router.get('/moderation/reports', controller.getModerationReports.bind(controller));
router.patch('/moderation/reports/:id', controller.resolveReport.bind(controller));
router.post('/moderation/users/:id/ban', controller.banUser.bind(controller));
router.post('/moderation/users/:id/suspend', controller.suspendUser.bind(controller));
router.post('/moderation/users/:id/unban', controller.unbanUser.bind(controller));
router.post('/moderation/users/:id/unsuspend', controller.unsuspendUser.bind(controller));

router.get('/subscriptions', commercialController.getSubscriptions.bind(commercialController));
router.get('/revenue', commercialController.getRevenue.bind(commercialController));
router.get('/conversions', commercialController.getConversions.bind(commercialController));
router.get('/churn', commercialController.getChurn.bind(commercialController));
router.get('/analytics', commercialController.getAnalytics.bind(commercialController));
router.get('/revenue-metrics', commercialController.getRevenueMetrics.bind(commercialController));
router.get('/coupons', commercialController.getCoupons.bind(commercialController));
router.post('/retention/run', commercialController.runRetention.bind(commercialController));
router.post('/winback/run', commercialController.runWinback.bind(commercialController));

router.get('/badges', controller.listSpecialBadges.bind(controller));
router.post('/badges', controller.createSpecialBadge.bind(controller));

router.get('/segments', controller.listSegments.bind(controller));
router.delete('/segments/:id', controller.deleteSegment.bind(controller));

router.get('/events', controller.listEvents.bind(controller));
router.delete('/events/:id', controller.deleteEvent.bind(controller));

router.get('/marketplace', controller.listMarketplaceListings.bind(controller));
router.delete('/marketplace/:id', controller.deleteMarketplaceListing.bind(controller));

router.get('/system-analytics', controller.getSystemAnalytics.bind(controller));

export default router;
