import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../configs/environment.js';
import { setIO } from './emitter.js';

export const initSockets = (server, options = {}) => {
  const io = new Server(server, {
    cors: {
      origin: options.corsOrigin || '*',
      methods: ['GET', 'POST'],
    },
  });

  setIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: user ${userId} (${socket.id})`);

    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room user:${userId}`);

    socket.on('joinRoom', (room) => {
      socket.join(room);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${userId} (${socket.id})`);
    });
  });

  return io;
};

export default initSockets;
