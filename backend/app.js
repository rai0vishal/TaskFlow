const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const xssSanitizer = require('./middleware/xssSanitizer');
const logger = require('./utils/logger');

const app = express();

// ============================
// Security Headers — Helmet
// ============================
// Build allowed origins for CSP connect-src
const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  })
);

// ============================
// CORS — fine-grained control
// ============================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600, // Preflight cache: 10 minutes
};
app.use(cors(corsOptions));

// ============================
// Rate Limiting (global)
// ============================
app.use('/api', apiLimiter);

// ============================
// Body Parsing
// ============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================
// Input Sanitization
// ============================
// Prevent NoSQL injection by stripping $ and . from req.body / query / params
app.use(mongoSanitize({ replaceWith: '_' }));

// Prevent XSS by escaping HTML entities in user input
app.use(xssSanitizer);

// Prevent HTTP Parameter Pollution (duplicate query params)
app.use(hpp());

// ============================
// HTTP Request Logging (Morgan → Winston)
// ============================
// Custom Morgan token for client IP
morgan.token('client-ip', (req) => req.ip || req.connection.remoteAddress);

const morganStream = {
  write: (message) => {
    // Parse the structured Morgan output into Winston metadata
    const parts = message.trim().split(' | ');
    if (parts.length === 5) {
      logger.http('incoming request', {
        method: parts[0],
        url: parts[1],
        status: parseInt(parts[2], 10),
        responseTime: parts[3],
        ip: parts[4],
      });
    } else {
      logger.http(message.trim());
    }
  },
};

app.use(
  morgan(':method | :url | :status | :response-time ms | :client-ip', {
    stream: morganStream,
    skip: (req) => {
      // In production, skip health-check spam
      if (process.env.NODE_ENV === 'production' && req.originalUrl === '/api/health') {
        return true;
      }
      return false;
    },
  })
);

// ============================
// API Documentation (Swagger)
// ============================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Project Management API Docs',
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================
// Health Check
// ============================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ============================
// API Routes
// ============================
app.use('/api/v1/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/v1/tasks', require('./routes/task.routes'));

// ============================
// Error Handling
// ============================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
