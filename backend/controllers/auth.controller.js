const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const authService = require('../services/auth.service');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  sendResponse(res, 201, 'User registered successfully', {
    user,
    token,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  sendResponse(res, 200, 'Login successful', {
    user,
    token,
  });
});

module.exports = {
  register,
  login,
};
