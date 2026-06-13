let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
};

export const getIO = () => io;

export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification', notification);
};

export const emitNotificationCount = (userId, count) => {
  emitToUser(userId, 'notification_count', { count });
};

export const emitFeedUpdate = (userId, activity) => {
  emitToUser(userId, 'feed_update', activity);
};

export const emitMetricsUpdate = (userId, metrics) => {
  emitToUser(userId, 'metrics_update', metrics);
};

export const emitCoachInsight = (userId, insight) => {
  emitToUser(userId, 'coach_insight', insight);
};

export const emitPlanUpdate = (userId, plan) => {
  emitToUser(userId, 'plan_update', plan);
};

export const emitHeatmapUpdate = (userId, heatmap) => {
  emitToUser(userId, 'heatmap_update', heatmap);
};

export const emitSyncUpdate = (userId, syncData) => {
  emitToUser(userId, 'sync_update', syncData);
};

export const emitIntegrationStatus = (userId, status) => {
  emitToUser(userId, 'integration_status', status);
};

export default {
  setIO, getIO, emitToUser,
  emitNotification, emitNotificationCount, emitFeedUpdate,
  emitMetricsUpdate, emitCoachInsight, emitPlanUpdate, emitHeatmapUpdate,
  emitSyncUpdate, emitIntegrationStatus,
};
