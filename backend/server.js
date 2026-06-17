const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const http = require('http');
const socketModule = require('./socket');
const cron = require('node-cron');
const Task = require('./models/Task');
const calculatePriority = require('./utils/priorityCalculator');

const startServer = async () => {
  // Startup Banner
  logger.info('='.repeat(50));
  logger.info('  Project Management System — Backend');
  logger.info('='.repeat(50));

  // Connect to MongoDB
  await connectDB();

  const server = http.createServer(app);
  
  // Initialize Socket.io
  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
  socketModule.init(server, allowedOrigins);

  server.listen(config.port, () => {
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

  // Nightly Priority Escalation Cron
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running nightly priority recalculation job...');
    try {
      const activeTasks = await Task.find({ status: { $in: ['todo', 'in-progress', 'in-review'] }, dueDate: { $ne: null } });
      let updatedCount = 0;

      if (activeTasks.length > 0) {
        // Collect all unique user IDs to query active counts in one aggregation
        const userIds = [...new Set(activeTasks.map((t) => t.createdBy?.toString()).filter(Boolean))];
        
        // Aggregate active tasks count grouped by user
        const countsAgg = await Task.aggregate([
          {
            $match: {
              createdBy: { $in: userIds.map((id) => new (require('mongoose').Types.ObjectId)(id)) },
              status: { $in: ['todo', 'in-progress'] }
            }
          },
          {
            $group: {
              _id: '$createdBy',
              count: { $sum: 1 }
            }
          }
        ]);

        const countsMap = new Map(countsAgg.map((item) => [item._id.toString(), item.count]));

        for (const task of activeTasks) {
          const userIdStr = task.createdBy ? task.createdBy.toString() : '';
          const activeTasksCount = countsMap.get(userIdStr) || 0;

          const { priorityScore, priorityLabel } = calculatePriority({
            dueDate: task.dueDate,
            complexity: task.complexity,
            activeTasksCount
          });

          if (task.priorityScore !== priorityScore || task.priorityLabel !== priorityLabel) {
            task.priorityScore = priorityScore;
            task.priorityLabel = priorityLabel;
            await task.save();
            updatedCount++;
            
            if (task.board) {
              socketModule.getIO().to(`board_${task.board}`).emit('taskUpdated', task);
            }
            socketModule.getIO().to(`user_${task.createdBy}`).emit('taskUpdated', task);
          }
        }
      }
      logger.info(`Nightly cron finished. Escalated ${updatedCount} task(s).`);
    } catch (error) {
      logger.error('Error running nightly cron job:', error);
    }
  });

  // Graceful Shutdown
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

  // Uncaught Error Safety Net
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
