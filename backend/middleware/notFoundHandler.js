const ApiError = require('../utils/ApiError');

/**
 * Middleware to handle 404 - Route Not Found.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
};

module.exports = notFoundHandler;
