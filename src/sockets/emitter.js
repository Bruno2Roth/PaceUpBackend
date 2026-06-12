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

export default { setIO, getIO, emitToUser, emitNotification, emitNotificationCount, emitFeedUpdate };
