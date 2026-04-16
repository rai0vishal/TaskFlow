const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validations/auth.validation');

/**
 * POST /api/v1/auth/register
 * Register a new user account.
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/v1/auth/login
 * Authenticate and receive a JWT.
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh-token
 * Get a new access and refresh token pair using an existing refresh token.
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

module.exports = router;
