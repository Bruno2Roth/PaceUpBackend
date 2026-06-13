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

  async notifyWeeklyReport(userId, report) {
    await this.createNotification({
      userId,
      type: 'weekly_report',
      title: 'Informe semanal disponible',
      message: `Tu informe semanal de entrenamiento ya está listo. ${report.summary || ''}`,
      metadata: { report_id: report.id, week: report.week },
    });
  }

  async notifyAIAnalysis(userId, analysis) {
    await this.createNotification({
      userId,
      type: 'ai_insight',
      title: 'Nuevo análisis de IA',
      message: `Coach IA: ${analysis.title || 'Nuevo análisis disponible'}`,
      metadata: { analysis_id: analysis.id },
    });
  }

  async notifyTrainingPlanUpdate(userId, plan) {
    await this.createNotification({
      userId,
      type: 'training_plan_update',
      title: 'Plan de entrenamiento actualizado',
      message: `Tu plan de entrenamiento ha sido actualizado. Semana actual: ${plan.progress?.completion_percent || 0}% completado`,
      metadata: { plan_id: plan.id, completion: plan.progress?.completion_percent },
    });
  }

  async notifyMetricsAlert(userId, alert) {
    await this.createNotification({
      userId,
      type: 'metrics_alert',
      title: alert.title || 'Alerta de métricas',
      message: alert.message || 'Revisa tus métricas de entrenamiento',
      metadata: { alert_type: alert.type, value: alert.value },
    });
  }

  async notifyIntegrationConnected(userId, provider) {
    await this.createNotification({
      userId,
      type: 'integration_connected',
      title: 'Conexión exitosa',
      message: `Tu cuenta de ${this._providerName(provider)} se ha conectado correctamente.`,
      metadata: { provider },
    });
  }

  async notifyIntegrationDisconnected(userId, provider) {
    await this.createNotification({
      userId,
      type: 'integration_disconnected',
      title: 'Conexión eliminada',
      message: `La conexión con ${this._providerName(provider)} se ha eliminado.`,
      metadata: { provider },
    });
  }

  async notifySyncCompleted(userId, provider, imported, total) {
    await this.createNotification({
      userId,
      type: 'sync_completed',
      title: 'Sincronización completada',
      message: `Se importaron ${imported} actividades de ${this._providerName(provider)}.`,
      metadata: { provider, imported, total },
    });
  }

  async notifySyncFailed(userId, provider, errorMsg) {
    await this.createNotification({
      userId,
      type: 'sync_failed',
      title: 'Error de sincronización',
      message: `No se pudo sincronizar ${this._providerName(provider)}: ${errorMsg}`,
      metadata: { provider, error: errorMsg },
    });
  }

  async notifyImportCompleted(userId, fileName, activityCount) {
    await this.createNotification({
      userId,
      type: 'import_completed',
      title: 'Archivo importado',
      message: `Se importaron ${activityCount} actividades desde "${fileName}".`,
      metadata: { file_name: fileName, count: activityCount },
    });
  }

  _providerName(provider) {
    const names = { garmin: 'Garmin', coros: 'COROS', polar: 'Polar', suunto: 'Suunto' };
    return names[provider] || provider;
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

  async notifyTrialExpiring(userId, daysRemaining) {
    await this.createNotification({
      userId,
      type: 'trial_expiring',
      title: 'Tu prueba gratuita está por terminar',
      message: `Te quedan ${daysRemaining} días de prueba gratuita. Suscríbete para seguir disfrutando de Premium.`,
      metadata: { days_remaining: daysRemaining },
    });
  }

  async notifySubscriptionRenewed(userId, planName, nextBillingDate) {
    await this.createNotification({
      userId,
      type: 'subscription_renewed',
      title: 'Suscripción renovada',
      message: `Tu suscripción ${planName} se ha renovado correctamente. Próxima factura: ${new Date(nextBillingDate).toLocaleDateString()}.`,
      metadata: { plan: planName, next_billing: nextBillingDate },
    });
  }

  async notifySubscriptionCancelled(userId, planName, accessUntil) {
    await this.createNotification({
      userId,
      type: 'subscription_cancelled',
      title: 'Suscripción cancelada',
      message: `Tu suscripción ${planName} ha sido cancelada. Tendrás acceso hasta el ${new Date(accessUntil).toLocaleDateString()}.`,
      metadata: { plan: planName, access_until: accessUntil },
    });
  }

  async notifyPaymentFailed(userId, planName, amount) {
    await this.createNotification({
      userId,
      type: 'payment_failed',
      title: 'Pago fallido',
      message: `No pudimos procesar el pago de ${planName} ($${amount}). Por favor actualiza tu método de pago.`,
      metadata: { plan: planName, amount },
    });
  }

  async notifyCouponReceived(userId, code, discountDescription) {
    await this.createNotification({
      userId,
      type: 'coupon_received',
      title: 'Cupón de descuento',
      message: `Has recibido un cupón: ${code} - ${discountDescription}`,
      metadata: { coupon_code: code, discount: discountDescription },
    });
  }
}

export default NotificationService;
