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
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
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

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
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

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
};

module.exports = {
  register,
  login,
  generateToken,
};
