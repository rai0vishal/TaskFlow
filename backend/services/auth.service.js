const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const ApiError = require('../utils/ApiError');

/**
 * Generate a signed JWT for a user.
 *
 * @param {object} user - Mongoose user document
 * @returns {string} JWT token
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user.
 *
 * @param {object} data - { name, email, password }
 * @returns {{ user: object, token: string }}
 */
const register = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  // Create user (password is hashed via pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate JWTs
  const tokens = generateTokens(user);
  
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, ...tokens };
};

/**
 * Authenticate a user with email and password.
 *
 * @param {object} data - { email, password }
 * @returns {{ user: object, token: string }}
 */
const login = async ({ email, password }) => {
  // Find user and explicitly include the password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate JWTs
  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, ...tokens };
};

/**
 * Refresh the access token using a refresh token.
 *
 * @param {string} token - The refresh token
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const refreshToken = async (token) => {
  if (!token) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });

    if (!user) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
};

module.exports = {
  register,
  login,
  generateTokens,
  refreshToken,
};
