import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';

// Config imports
import config from './config/env.js';
import connectDB from './config/database.js';
import logger from './config/logger.js';
import { helmetConfig, rateLimiter } from './config/security.js';
import { swaggerUi, specs } from './config/swagger.js';
import './config/passport-setup.js'; // This executes the passport config

// Route imports
import sudokuRoutes from './api/sudoku.routes.js';
import authRoutes from './api/auth.routes.js';
import adminRoutesFactory from './api/admin.routes.js';
import puzzleRoutesFactory from './api/puzzle.routes.js';
import healthRoutes from './api/health.routes.js';
import { errorHandler, notFoundHandler } from './api/middleware/error.middleware.js';

// Model imports
import User from './models/user.model.js';
import Puzzle from './models/puzzle.model.js';
import mongoose from 'mongoose';

const app = express();

// Connect to Database
connectDB();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(rateLimiter);

// Logging middleware
if (!config.isTest) {
  app.use(morgan(config.log.format, { stream: logger.stream }));
}

// Session middleware
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation (before authentication)
if (!config.isProduction) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SudoQMaestro API Documentation'
  }));
}

// Health check routes (before authentication)
app.use('/', healthRoutes);

// API Routes
const adminRoutes = adminRoutesFactory(User, Puzzle);
app.use('/api/auth', authRoutes);
app.use('/api/sudoku', sudokuRoutes);
app.use('/api/admin', adminRoutes);

const puzzleRoutes = puzzleRoutesFactory(Puzzle);
app.use('/api/puzzles', puzzleRoutes);

// Basic Route for checking if the server is running
app.get('/', (req, res) => {
  res.json({
    name: 'SudoQMaestro Backend',
    status: 'running',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(() => {
        logger.info('Database connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force close after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start Server
const server = app.listen(config.port, () => {
  logger.info(`SudoQMaestro Backend is running on port: ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
