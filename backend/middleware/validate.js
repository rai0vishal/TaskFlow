const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Creates a middleware that validates the request body against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed; // Replace body with parsed (and potentially transformed) data
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(ApiError.badRequest('Validation failed', errors));
    } else {
      next(error);
    }
  }
};

module.exports = validate;
