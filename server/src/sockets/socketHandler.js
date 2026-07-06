const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');
const Message = require('../models/Message');
const { assertParticipant } = require('../controllers/chatController');
const logger = require('../config/logger');

/**
 * Socket.io middleware: authenticates the socket handshake using the
 * same access token issued by the REST auth flow.
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user || user.isBanned) return next(new Error('Authentication failed'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
}

function initSocket(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (user: ${socket.user._id})`);

    // Personal room for direct notifications
    socket.join(`user:${socket.user._id}`);

    socket.on('ride:join', async ({ rideId }, callback) => {
      try {
        await assertParticipant(rideId, socket.user._id);
        socket.join(`ride:${rideId}`);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    socket.on('ride:leave', ({ rideId }) => {
      socket.leave(`ride:${rideId}`);
    });

    socket.on('chat:send', async ({ rideId, text }, callback) => {
      try {
        if (!text || !text.trim()) throw new Error('Message text is required');
        await assertParticipant(rideId, socket.user._id);

        const message = await Message.create({
          ride: rideId,
          sender: socket.user._id,
          text: text.trim(),
          readBy: [socket.user._id],
        });

        const populated = await message.populate('sender', 'name avatar');

        io.to(`ride:${rideId}`).emit('chat:message', populated);
        callback?.({ success: true, message: populated });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    socket.on('chat:typing', ({ rideId }) => {
      socket.to(`ride:${rideId}`).emit('chat:typing', {
        rideId,
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocket;
