const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');
const logger = require('./config/logger');
const { port, clientUrl } = require('./config/env');

// Fail fast on programming errors that Express can't catch
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

async function start() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });
  initSocket(io);

  // Make io accessible inside controllers via req.app.get('io')
  app.set('io', io);

  server.listen(port, () => {
    logger.info(`🚀 GoTogether API running on port ${port}`);
  });

  // Handle promise rejections that slipped past asyncHandler
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown on deploy restarts / container stop signals
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
    // Force-exit if shutdown hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
