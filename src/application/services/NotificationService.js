import NotificationRepository from '../../data/repositories/NotificationRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import { emitNotification, emitNotificationCount } from '../../sockets/emitter.js';

export class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  async createNotification({ userId, type, title, message, actorId, metadata, activityId, commentId }) {
    const notification = await this.notificationRepository.createNotification({
      userId, type, title, message, actorId, metadata, activityId, commentId,
    });

    const actor = actorId ? await this.userRepository.findNonDeletedById(actorId) : null;
    const enriched = {
      ...notification,
      actor_name: actor ? actor.name : '',
      actor_avatar: actor ? actor.profile_picture_url : '',
    };

    emitNotification(userId, enriched);

    const unreadCount = await this.notificationRepository.countUnread(userId);
    emitNotificationCount(userId, unreadCount);

    return notification;
  }

  async notifyFollow(targetUserId, actorId) {
    if (targetUserId === actorId) return;

    const hasSimilar = await this.notificationRepository.hasSimilarNotification(
      targetUserId, 'follow', actorId, 24,
    );
    if (hasSimilar) return;

    const actor = await this.userRepository.findNonDeletedById(actorId);
    await this.createNotification({
      userId: targetUserId,
      type: 'follow',
      title: 'Nuevo seguidor',
      message: `${actor.name} empezó a seguirte`,
      actorId,
    });
  }

  async notifyLike(activityOwnerId, activityId, actorId) {
    if (activityOwnerId === actorId) return;

    const hasSimilar = await this.notificationRepository.hasSimilarNotification(
      activityOwnerId, 'like', actorId, 1,
    );
    if (hasSimilar) return;

    const actor = await this.userRepository.findNonDeletedById(actorId);
    await this.createNotification({
      userId: activityOwnerId,
      type: 'like',
      title: 'Nuevo like',
      message: `A ${actor.name} le gustó tu actividad`,
      actorId,
      activityId,
    });
  }

  async notifyComment(activityOwnerId, activityId, actorId, commentId) {
    if (activityOwnerId === actorId) return;

    const hasSimilar = await this.notificationRepository.hasSimilarNotification(
      activityOwnerId, 'comment', actorId, 1,
    );
    if (hasSimilar) return;

    const actor = await this.userRepository.findNonDeletedById(actorId);
    await this.createNotification({
      userId: activityOwnerId,
      type: 'comment',
      title: 'Nuevo comentario',
      message: `${actor.name} comentó tu actividad`,
      actorId,
      activityId,
      commentId,
    });
  }

  async getUserNotifications(userId, limit = 20, offset = 0) {
    return this.notificationRepository.findByUserId(userId, limit, offset);
  }

  async markAsRead(notificationId, userId) {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.user_id !== userId) {
      const err = new Error('Notification not found');
      err.status = 404;
      throw err;
    }
    return this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId) {
    const result = await this.notificationRepository.markAllAsRead(userId);
    emitNotificationCount(userId, 0);
    return result;
  }

  async getUnreadCount(userId) {
    return this.notificationRepository.countUnread(userId);
  }
}

export default NotificationService;
