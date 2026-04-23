const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Required env var checks
const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Gracefully exit if critical environment variables are missing to prevent runtime crashes
  console.error('\n╔══════════════════════════════════════════════════╗');
  console.error('║  FATAL: Missing required environment variables   ║');
  console.error('╚══════════════════════════════════════════════════╝');
  missing.forEach((key) => console.error(`  ✗  ${key}`));
  console.error('\nPlease configure your .env file. See .env.example for reference.\n');
  process.exit(1);
}

// Config export
const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database
  mongoUri: process.env.MONGODB_URI,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
