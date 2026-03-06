const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const startServer = async () => {
  // ============================
  // Startup Banner
  // ============================
  logger.info('='.repeat(50));
  logger.info('  Project Management System — Backend');
  logger.info('='.repeat(50));

  // Connect to MongoDB
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server started successfully`, {
      port: config.port,
      environment: config.env,
      pid: process.pid,
      nodeVersion: process.version,
    });
    logger.info(`Health check: http://localhost:${config.port}/api/health`);
    logger.info(`API base:     http://localhost:${config.port}/api/v1`);
    logger.info('='.repeat(50));
  });

  // ============================
  // Graceful Shutdown
  // ============================
  const shutdown = (signal) => {
    logger.warn(`${signal} received — starting graceful shutdown...`);
    server.close(() => {
      logger.info('All connections closed. Server shut down.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10 s — forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ============================
  // Uncaught Error Safety Net
  // ============================
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection', {
      message: err.message,
      stack: err.stack,
    });
    shutdown('UNHANDLED_REJECTION');
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      message: err.message,
      stack: err.stack,
    });
    shutdown('UNCAUGHT_EXCEPTION');
  });
};

startServer();
