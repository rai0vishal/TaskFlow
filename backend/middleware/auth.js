const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to protect routes — verifies JWT from Authorization header.
 * Attaches the authenticated user to `req.user`.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from "Bearer <token>" header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Access denied. No token provided.');
  }

  // Verify token
  const decoded = jwt.verify(token, config.jwt.secret);

  // Attach user to request (exclude password)
  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists.');
  }

  req.user = user;
  next();
});

/**
 * Middleware to restrict access to specific roles.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'manager')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
