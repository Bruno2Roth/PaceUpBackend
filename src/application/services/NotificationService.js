import NotificationRepository from '../../data/repositories/NotificationRepository.js';
import UserRepository from '../../data/repositories/UserRepository.js';
import { emitNotification, emitNotificationCount } from '../../sockets/emitter.js';

export class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  async createNotification({ userId, type, title, message, actorId, metadata, activityId, commentId, challengeId, clubId }) {
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

  async notifyAchievement(userId, achievement) {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: 'Nuevo logro',
      message: `Has desbloqueado el logro: ${achievement.title}`,
      metadata: { achievement_id: achievement.id, achievement_type: achievement.achievement_type },
    });
  }

  async notifyChallengeCreated(userId, challenge) {
    await this.createNotification({
      userId,
      type: 'challenge',
      title: 'Nuevo desafío',
      message: `Se ha creado un nuevo desafío: ${challenge.title}`,
      metadata: { challenge_id: challenge.id },
      challengeId: challenge.id,
    });
  }

  async notifyRankingUpdate(userId, rankType) {
    await this.createNotification({
      userId,
      type: 'ranking',
      title: 'Nuevo ranking',
      message: `Has subido en el ranking ${rankType}`,
      metadata: { rank_type: rankType },
    });
  }

  async notifyClubInvitation(userId, inviterId, club) {
    const inviter = await this.userRepository.findNonDeletedById(inviterId);
    await this.createNotification({
      userId,
      type: 'club_invitation',
      title: 'Invitación a club',
      message: `${inviter.name} te ha invitado a unirte al club "${club.name}"`,
      actorId: inviterId,
      metadata: { club_id: club.id, club_name: club.name },
      clubId: club.id,
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
