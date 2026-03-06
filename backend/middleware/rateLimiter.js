const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter.
 * Limits each IP to a set number of requests per window.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes.',
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Prevents brute-force login / registration abuse.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
