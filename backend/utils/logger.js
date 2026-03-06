const winston = require('winston');
const path = require('path');
const config = require('../config');

const logDir = path.resolve(__dirname, '..', 'logs');

// ============================
// Custom Log Levels (includes 'http')
// ============================
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'cyan',
  debug: 'gray',
};

winston.addColors(colors);

// ============================
// Formats
// ============================

// Human-readable format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `${timestamp} ${level}: ${message}\n${stack}`
      : `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Structured JSON format for log files (easily parseable by log aggregators)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================
// Logger Instance
// ============================
const logger = winston.createLogger({
  levels,
  level: config.logLevel || 'debug',
  transports: [
    // ---- Console ----
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // ---- Error log file (JSON) ----
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),

    // ---- HTTP request log file (JSON) ----
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 3,
    }),

    // ---- Combined log file (JSON) ----
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
