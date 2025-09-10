/**
 * Error handling middleware
 */

import multer from 'multer';

import config from '../../config/env.js';

/**
 * Handle 404 errors - catch-all for routes that don't exist
 */
export const notFoundHandler = (req, res, _next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler
 * This should be the last middleware
 */
export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';
  
  // Handle specific error types
  
  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return res.status(statusCode).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
    
    return res.status(statusCode).json({
      success: false,
      error: 'Duplicate Entry',
      message,
      field
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    
    return res.status(statusCode).json({
      success: false,
      error: 'Invalid ID',
      message
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Multer errors (file upload)
  if (error instanceof multer.MulterError) {
    statusCode = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload error';
    }
  }
  
  // MongoDB connection errors
  if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
    statusCode = 503;
    message = 'Database connection error';
  }
  
  // Log error for debugging (but not in tests)
  if (config.nodeEnv !== 'test') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  // Prepare error response
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error;
  }
  
  // Include request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Unauthorized error class
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden error class
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export default {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
