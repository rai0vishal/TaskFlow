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

// Security Headers (Helmet) - Protects against common web vulnerabilities like XSS, Clickjacking, etc.
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

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600,
};
app.use(cors(corsOptions));

// Rate Limiting
app.use('/api', apiLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(xssSanitizer);
app.use(hpp());

// HTTP Request Logging using Morgan and Winston
morgan.token('client-ip', (req) => req.ip || req.connection.remoteAddress);

const morganStream = {
  write: (message) => {
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
      // Skip logging for health check endpoint in production to reduce noise
      if (process.env.NODE_ENV === 'production' && req.originalUrl === '/api/health') {
        return true;
      }
      return false;
    },
  })
);

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Project Management API Docs',
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/v1/workspaces', require('./routes/workspace.routes'));
app.use('/api/v1/boards', require('./routes/board.routes'));
app.use('/api/v1/lists', require('./routes/list.routes'));
app.use('/api/v1/tasks', require('./routes/task.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/profile', require('./routes/profile.routes'));
app.use('/api/v1/chat', require('./routes/chat.routes'));
app.use('/api/v1/invites', require('./routes/invite.routes'));

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
