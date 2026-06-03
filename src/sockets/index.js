import { Server } from 'socket.io';

export const initSockets = (server, options = {}) => {
  const io = new Server(server, {
    cors: {
      origin: options.corsOrigin || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    socket.on('joinRoom', (room) => {
      socket.join(room);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });

  return io;
};

export default initSockets;
