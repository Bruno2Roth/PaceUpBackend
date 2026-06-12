import NotificationService from '../../application/services/NotificationService.js';

export class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async getNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const notifications = await this.notificationService.getUserNotifications(req.userId, limit, offset);
      const unreadCount = await this.notificationService.getUnreadCount(req.userId);
      return res.status(200).json({ notifications, unread_count: unreadCount });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await this.notificationService.markAsRead(req.params.id, req.userId);
      return res.status(200).json({ notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await this.notificationService.markAllAsRead(req.userId);
      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await this.notificationService.getUnreadCount(req.userId);
      return res.status(200).json({ unread_count: count });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
