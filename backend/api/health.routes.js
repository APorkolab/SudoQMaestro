import express from 'express';
import mongoose from 'mongoose';
import { healthLimiter } from '../config/security.js';

const router = express.Router();

/**
 * Health check endpoint
 * Returns application status and dependencies
 */
router.get('/health', healthLimiter, async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: 'OK',
      memory: 'OK',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      healthCheck.status = 'ERROR';
      healthCheck.checks.database = 'ERROR';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    if (memoryUsageMB > 512) { // Alert if using more than 512MB
      healthCheck.checks.memory = 'WARNING';
    }

    healthCheck.memory = {
      used: memoryUsageMB,
      unit: 'MB',
    };

    // Return appropriate status code
    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

/**
 * Readiness check endpoint
 * Returns 200 when app is ready to serve traffic
 */
router.get('/ready', healthLimiter, async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'NOT_READY',
        message: 'Database not connected',
      });
    }

    res.status(200).json({
      status: 'READY',
      timestamp: Date.now(),
    });

  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      error: error.message,
    });
  }
});

/**
 * Liveness check endpoint
 * Returns 200 if the app is alive (basic health)
 */
router.get('/live', healthLimiter, (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

export default router;
