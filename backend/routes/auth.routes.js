const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

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

module.exports = router;
