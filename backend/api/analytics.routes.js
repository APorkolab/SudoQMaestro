import express from 'express';
import performanceMonitor from '../middleware/performance-monitor.js';

const router = express.Router();

// Middleware to check admin access (simplified for now)
const requireAdmin = (req, res, next) => {
  // In a real implementation, check user role
  // For now, just check for a special header or environment
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 
                  process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

/**
 * POST /api/analytics/performance
 * Receive performance metrics from frontend
 */
router.post('/performance', (req, res) => {
  try {
    const { metrics } = req.body;
    
    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ error: 'Invalid metrics data' });
    }

    // Process and store frontend metrics
    metrics.forEach(metric => {
      // Add server timestamp and request info
      const enrichedMetric = {
        ...metric,
        serverTimestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        source: 'frontend'
      };

      // Store based on metric type
      if (metric.type) {
        performanceMonitor.recordCustomMetric(metric.type, enrichedMetric);
      }
    });

    res.json({ success: true, processed: metrics.length });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    res.status(500).json({ error: 'Failed to process metrics' });
  }
});

/**
 * GET /api/analytics/metrics/summary
 * Get performance metrics summary (admin only)
 */
router.get('/metrics/summary', requireAdmin, (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 3600000; // Default 1 hour
    const summary = performanceMonitor.getMetricsSummary(timeRange);
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting metrics summary:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics summary' });
  }
});

/**
 * GET /api/analytics/metrics/raw
 * Get raw metrics data (admin only)
 */
router.get('/metrics/raw', requireAdmin, (req, res) => {
  try {
    const rawMetrics = performanceMonitor.getRawMetrics();
    res.json(rawMetrics);
  } catch (error) {
    console.error('Error getting raw metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve raw metrics' });
  }
});

/**
 * GET /api/analytics/health
 * Get application health status
 */
router.get('/health', (req, res) => {
  try {
    const health = performanceMonitor.getHealthStatus();
    
    // Set appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 500;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to retrieve health status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analytics/metrics/requests
 * Get request metrics with filtering (admin only)
 */
router.get('/metrics/requests', requireAdmin, (req, res) => {
  try {
    const {
      timeRange = 3600000,
      method,
      statusCode,
      slow,
      limit = 100
    } = req.query;

    const cutoffTime = Date.now() - parseInt(timeRange);
    const rawMetrics = performanceMonitor.getRawMetrics();
    
    let requests = rawMetrics.requests.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    // Apply filters
    if (method) {
      requests = requests.filter(r => r.method === method);
    }
    
    if (statusCode) {
      requests = requests.filter(r => r.statusCode === parseInt(statusCode));
    }
    
    if (slow === 'true') {
      requests = requests.filter(r => r.slow);
    }

    // Limit results and sort by timestamp (newest first)
    requests = requests
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, parseInt(limit));

    res.json({
      requests,
      total: requests.length,
      filters: { timeRange, method, statusCode, slow },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting request metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve request metrics' });
  }
});

/**
 * GET /api/analytics/metrics/errors
 * Get error metrics (admin only)
 */
router.get('/metrics/errors', requireAdmin, (req, res) => {
  try {
    const {
      timeRange = 3600000,
      limit = 50
    } = req.query;

    const cutoffTime = Date.now() - parseInt(timeRange);
    const rawMetrics = performanceMonitor.getRawMetrics();
    
    const errors = rawMetrics.errors
      .filter(metric => new Date(metric.timestamp).getTime() > cutoffTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, parseInt(limit));

    // Group errors by message for summary
    const errorSummary = errors.reduce((summary, error) => {
      const key = error.message;
      if (!summary[key]) {
        summary[key] = {
          message: key,
          count: 0,
          lastSeen: error.timestamp,
          statusCodes: {}
        };
      }
      summary[key].count++;
      summary[key].statusCodes[error.statusCode] = 
        (summary[key].statusCodes[error.statusCode] || 0) + 1;
      
      if (new Date(error.timestamp) > new Date(summary[key].lastSeen)) {
        summary[key].lastSeen = error.timestamp;
      }
      
      return summary;
    }, {});

    res.json({
      errors,
      summary: Object.values(errorSummary),
      total: errors.length,
      timeRange,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting error metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve error metrics' });
  }
});

/**
 * GET /api/analytics/metrics/database
 * Get database performance metrics (admin only)
 */
router.get('/metrics/database', requireAdmin, (req, res) => {
  try {
    const {
      timeRange = 3600000,
      slow = false,
      limit = 100
    } = req.query;

    const cutoffTime = Date.now() - parseInt(timeRange);
    const rawMetrics = performanceMonitor.getRawMetrics();
    
    let dbQueries = rawMetrics.database.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    if (slow === 'true') {
      dbQueries = dbQueries.filter(q => q.slow);
    }

    dbQueries = dbQueries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, parseInt(limit));

    // Calculate statistics
    const avgDuration = dbQueries.length > 0 ?
      dbQueries.reduce((sum, q) => sum + q.duration, 0) / dbQueries.length : 0;
    
    const slowQueries = dbQueries.filter(q => q.slow).length;
    const errorQueries = dbQueries.filter(q => q.error).length;

    res.json({
      queries: dbQueries,
      statistics: {
        total: dbQueries.length,
        averageDuration: avgDuration,
        slowQueries,
        errorQueries,
        errorRate: dbQueries.length > 0 ? errorQueries / dbQueries.length : 0
      },
      timeRange,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting database metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve database metrics' });
  }
});

/**
 * GET /api/analytics/metrics/system
 * Get current system metrics (admin only)
 */
router.get('/metrics/system', requireAdmin, (req, res) => {
  try {
    const rawMetrics = performanceMonitor.getRawMetrics();
    const systemMetrics = rawMetrics.system;
    
    // Add current process info
    const currentMetrics = {
      ...systemMetrics,
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    };

    res.json(currentMetrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve system metrics' });
  }
});

/**
 * POST /api/analytics/config
 * Update performance monitoring configuration (admin only)
 */
router.post('/config', requireAdmin, (req, res) => {
  try {
    const config = req.body;
    performanceMonitor.configure(config);
    
    res.json({ 
      success: true, 
      message: 'Configuration updated',
      config 
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * POST /api/analytics/clear
 * Clear metrics data (admin only)
 */
router.post('/clear', requireAdmin, (req, res) => {
  try {
    const { type } = req.body;
    const rawMetrics = performanceMonitor.getRawMetrics();
    
    if (type === 'all') {
      rawMetrics.requests = [];
      rawMetrics.errors = [];
      rawMetrics.database = [];
      if (rawMetrics.gc) rawMetrics.gc = [];
    } else if (type && rawMetrics[type]) {
      rawMetrics[type] = Array.isArray(rawMetrics[type]) ? [] : {};
    }
    
    res.json({ 
      success: true, 
      message: `Cleared ${type || 'all'} metrics` 
    });
  } catch (error) {
    console.error('Error clearing metrics:', error);
    res.status(500).json({ error: 'Failed to clear metrics' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get dashboard data with key metrics (admin only)
 */
router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeRange = req.query.timeRange || '1h';
    const range = timeRanges[timeRange] || timeRanges['1h'];
    
    const summary = performanceMonitor.getMetricsSummary(range);
    const health = performanceMonitor.getHealthStatus();
    
    // Add trending data (simplified)
    const rawMetrics = performanceMonitor.getRawMetrics();
    const cutoffTime = Date.now() - range;
    
    const recentRequests = rawMetrics.requests.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );
    
    // Group by hour for trending
    const hourlyStats = {};
    recentRequests.forEach(request => {
      const hour = new Date(request.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { requests: 0, errors: 0, totalDuration: 0 };
      }
      hourlyStats[hour].requests++;
      hourlyStats[hour].totalDuration += request.duration;
      if (request.statusCode >= 400) {
        hourlyStats[hour].errors++;
      }
    });
    
    const dashboard = {
      overview: {
        totalRequests: summary.requests.total,
        averageResponseTime: summary.requests.averageResponseTime,
        errorRate: summary.errors.errorRate,
        systemHealth: health.status
      },
      performance: {
        slowRequests: summary.requests.slowRequests,
        dbSlowQueries: summary.database.slowQueries,
        memoryUtilization: summary.system.memory?.utilization,
        uptime: summary.system.system?.processUptime
      },
      trending: {
        hourlyStats,
        timeRange
      },
      alerts: this.generateAlerts(summary, health),
      timestamp: new Date().toISOString()
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

// Helper function to generate alerts based on metrics
function generateAlerts(summary, health) {
  const alerts = [];
  
  // High error rate
  if (summary.errors.errorRate > 0.05) { // 5%
    alerts.push({
      level: 'warning',
      message: `High error rate: ${(summary.errors.errorRate * 100).toFixed(2)}%`,
      metric: 'errorRate',
      value: summary.errors.errorRate
    });
  }
  
  // Slow response times
  if (summary.requests.averageResponseTime > 1000) { // 1 second
    alerts.push({
      level: 'warning',
      message: `Slow average response time: ${summary.requests.averageResponseTime.toFixed(0)}ms`,
      metric: 'responseTime',
      value: summary.requests.averageResponseTime
    });
  }
  
  // High memory usage
  if (summary.system.memory?.utilization > 0.8) { // 80%
    alerts.push({
      level: 'warning',
      message: `High memory usage: ${(summary.system.memory.utilization * 100).toFixed(1)}%`,
      metric: 'memoryUsage',
      value: summary.system.memory.utilization
    });
  }
  
  // Database performance
  if (summary.database.errorRate > 0.02) { // 2%
    alerts.push({
      level: 'warning',
      message: `High database error rate: ${(summary.database.errorRate * 100).toFixed(2)}%`,
      metric: 'dbErrorRate',
      value: summary.database.errorRate
    });
  }
  
  return alerts;
}

export default router;
