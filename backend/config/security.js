import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './env.js';

/**
 * Security middleware configuration
 */

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't rate limit successful requests
  skipSuccessfulRequests: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// API specific rate limiter for upload endpoints
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit uploads to 10 per 15 minutes
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts to 5 per 15 minutes
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sudoku solving rate limiter (computational intensive)
export const solveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit solve requests to 20 per 5 minutes
  message: {
    error: 'Too many solve requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Puzzle generation rate limiter
export const generateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit generation to 50 per 5 minutes
  message: {
    error: 'Too many puzzle generation requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations rate limiter (stricter)
export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit admin operations to 30 per 10 minutes
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Data modification rate limiter (save, delete)
export const modificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit data modifications to 100 per 10 minutes
  message: {
    error: 'Too many modification requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check rate limiter (more lenient)
export const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit health checks to 10 per minute
  message: {
    error: 'Too many health check requests from this IP.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General purpose rate limiter for standard API requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit general requests to 200 per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation schemas
export const validationSchemas = {
  // Add your Joi schemas here as needed
};
