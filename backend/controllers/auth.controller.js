const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const authService = require('../services/auth.service');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  sendResponse(res, 201, 'User registered successfully', {
    user,
    accessToken,
    refreshToken,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  sendResponse(res, 200, 'Login successful', {
    user,
    accessToken,
    refreshToken,
  });
});

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshToken(req.body.refreshToken);

  sendResponse(res, 200, 'Token refreshed successfully', tokens);
});

module.exports = {
  register,
  login,
  refreshToken,
};
