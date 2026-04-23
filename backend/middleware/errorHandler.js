const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Normalises all error types (Mongoose, JWT, Zod, rate-limit, CORS, etc.)
 * into a consistent JSON response and logs appropriately.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose Errors
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  // CORS Error
  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Cross-origin request blocked';
  }

  // Payload Too Large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large';
  }

  // Malformed JSON (Parser Error)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Structured Logging for error tracking - includes stack trace for internal errors (500+)
  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    ...(statusCode >= 500 && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, logMeta);
  } else {
    logger.warn(`${statusCode} - ${message}`, logMeta);
  }

  // Response Construction - ensuring consistent error format
  const response = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace only in development to aid debugging without leaking details in production
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
