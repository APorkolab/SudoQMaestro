import os from 'os';
import process from 'process';
import { performance, PerformanceObserver } from 'perf_hooks';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      system: {},
      database: [],
      errors: []
    };
    
    this.config = {
      enabled: true,
      sampleRate: 1.0, // 100% sampling in development
      maxMetricsAge: 3600000, // 1 hour in milliseconds
      cleanupInterval: 300000, // 5 minutes
      slowRequestThreshold: 1000, // 1 second
      memoryThreshold: 0.8, // 80% memory usage
      cpuThreshold: 0.8 // 80% CPU usage
    };

    this.systemMetricsInterval = null;
    this.cleanupInterval = null;
    
    if (this.config.enabled) {
      this.startSystemMonitoring();
      this.startPerformanceObserver();
      this.startCleanupScheduler();
    }
  }

  // Middleware for request performance monitoring
  requestMonitoringMiddleware() {
    return (req, res, next) => {
      if (!this.config.enabled || Math.random() > this.config.sampleRate) {
        return next();
      }

      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = function(...args) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const endMemory = process.memoryUsage();
        
        // Create request metrics
        const requestMetric = {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external
          },
          userAgent: req.get('user-agent'),
          ip: req.ip || req.connection.remoteAddress,
          contentLength: res.get('content-length') || 0
        };

        // Add additional context for slow requests
        if (duration > this.config.slowRequestThreshold) {
          requestMetric.slow = true;
          requestMetric.trace = new Error().stack;
        }

        this.recordRequestMetric(requestMetric);
        originalEnd.apply(this, args);
      }.bind(this);

      next();
    };
  }

  // Error monitoring middleware
  errorMonitoringMiddleware() {
    return (err, req, res, next) => {
      if (this.config.enabled) {
        const errorMetric = {
          timestamp: new Date().toISOString(),
          message: err.message,
          stack: err.stack,
          statusCode: err.statusCode || 500,
          method: req.method,
          url: req.url,
          userAgent: req.get('user-agent'),
          ip: req.ip || req.connection.remoteAddress
        };

        this.recordErrorMetric(errorMetric);
      }

      next(err);
    };
  }

  // Database operation monitoring
  createDatabaseMonitor() {
    return {
      startQuery: (query) => {
        const queryId = Math.random().toString(36).substring(7);
        const startTime = performance.now();
        
        return {
          queryId,
          startTime,
          query,
          end: (error = null, result = null) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const dbMetric = {
              timestamp: new Date().toISOString(),
              queryId,
              query: this.sanitizeQuery(query),
              duration,
              error: error ? error.message : null,
              resultCount: result ? (Array.isArray(result) ? result.length : 1) : 0,
              slow: duration > 100 // Consider queries > 100ms as slow
            };

            this.recordDatabaseMetric(dbMetric);
          }
        };
      }
    };
  }

  startSystemMonitoring() {
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  startPerformanceObserver() {
    // Monitor garbage collection
    if (typeof global.gc !== 'undefined') {
      const obs = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'gc') {
            this.recordGCMetric({
              timestamp: new Date().toISOString(),
              kind: entry.kind,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });

      try {
        obs.observe({ entryTypes: ['gc'] });
      } catch (error) {
        // GC performance observation not available - this is normal in some environments
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('GC performance observation not available:', error.message);
        }
      }
    }
  }

  startCleanupScheduler() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.cleanupInterval);
  }

  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const loadAverage = os.loadavg();
    const processMemory = process.memoryUsage();
    const processUptime = process.uptime();
    
    // Calculate CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    
    const systemMetric = {
      timestamp: new Date().toISOString(),
      cpu: {
        count: cpus.length,
        loadAverage,
        usage: cpuUsage
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        utilization: (totalMemory - freeMemory) / totalMemory,
        process: processMemory
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        processUptime
      }
    };

    // Check for high resource usage
    if (systemMetric.memory.utilization > this.config.memoryThreshold) {
      systemMetric.memoryAlert = true;
    }

    this.recordSystemMetric(systemMetric);
  }

  recordRequestMetric(metric) {
    this.metrics.requests.push(metric);
    this.trimMetricsArray(this.metrics.requests);
  }

  recordErrorMetric(metric) {
    this.metrics.errors.push(metric);
    this.trimMetricsArray(this.metrics.errors);
  }

  recordDatabaseMetric(metric) {
    this.metrics.database.push(metric);
    this.trimMetricsArray(this.metrics.database);
  }

  recordSystemMetric(metric) {
    this.metrics.system = metric;
  }

  recordGCMetric(metric) {
    if (!this.metrics.gc) this.metrics.gc = [];
    this.metrics.gc.push(metric);
    this.trimMetricsArray(this.metrics.gc);
  }

  trimMetricsArray(metricsArray, maxSize = 1000) {
    if (metricsArray.length > maxSize) {
      metricsArray.splice(0, metricsArray.length - maxSize);
    }
  }

  cleanupOldMetrics() {
    const cutoffTime = Date.now() - this.config.maxMetricsAge;

    // Clean up old metrics
    this.metrics.requests = this.metrics.requests.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );
    
    this.metrics.errors = this.metrics.errors.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );
    
    this.metrics.database = this.metrics.database.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    if (this.metrics.gc) {
      this.metrics.gc = this.metrics.gc.filter(
        metric => new Date(metric.timestamp).getTime() > cutoffTime
      );
    }
  }

  sanitizeQuery(query) {
    // Remove sensitive data from query strings for logging
    if (typeof query === 'string') {
      return query.replace(/password|token|secret|key/gi, '[REDACTED]');
    }
    return JSON.stringify(query, (key, value) => {
      if (key.match(/password|token|secret|key/i)) {
        return '[REDACTED]';
      }
      return value;
    });
  }

  // Analytics methods
  getMetricsSummary(timeRange = 3600000) { // Default 1 hour
    const cutoffTime = Date.now() - timeRange;
    
    const recentRequests = this.metrics.requests.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    const recentErrors = this.metrics.errors.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    const recentDbQueries = this.metrics.database.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );

    return {
      requests: {
        total: recentRequests.length,
        averageResponseTime: this.calculateAverage(recentRequests.map(r => r.duration)),
        slowRequests: recentRequests.filter(r => r.slow).length,
        statusCodes: this.groupBy(recentRequests, 'statusCode'),
        methods: this.groupBy(recentRequests, 'method'),
        topEndpoints: this.getTopEndpoints(recentRequests)
      },
      errors: {
        total: recentErrors.length,
        errorRate: recentRequests.length > 0 ? recentErrors.length / recentRequests.length : 0,
        topErrors: this.getTopErrors(recentErrors)
      },
      database: {
        queries: recentDbQueries.length,
        averageQueryTime: this.calculateAverage(recentDbQueries.map(q => q.duration)),
        slowQueries: recentDbQueries.filter(q => q.slow).length,
        errorRate: recentDbQueries.length > 0 ? 
          recentDbQueries.filter(q => q.error).length / recentDbQueries.length : 0
      },
      system: this.metrics.system,
      timestamp: new Date().toISOString()
    };
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  getTopEndpoints(requests, limit = 10) {
    const endpoints = this.groupBy(requests, 'url');
    return Object.entries(endpoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([url, count]) => ({ url, count }));
  }

  getTopErrors(errors, limit = 10) {
    const errorMessages = this.groupBy(errors, 'message');
    return Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([message, count]) => ({ message, count }));
  }

  // Health check
  getHealthStatus() {
    const systemMetric = this.metrics.system;
    const recentErrors = this.metrics.errors.filter(
      error => new Date(error.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
    );

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        memory: {
          status: systemMetric.memory?.utilization < this.config.memoryThreshold ? 'healthy' : 'warning',
          utilization: systemMetric.memory?.utilization,
          threshold: this.config.memoryThreshold
        },
        errors: {
          status: recentErrors.length < 10 ? 'healthy' : 'warning',
          recentErrorCount: recentErrors.length,
          threshold: 10
        },
        uptime: {
          status: 'healthy',
          processUptime: systemMetric.system?.processUptime,
          systemUptime: systemMetric.system?.uptime
        }
      }
    };

    // Overall status
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
    if (hasWarnings) {
      health.status = 'warning';
    }

    return health;
  }

  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  disable() {
    this.config.enabled = false;
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  getRawMetrics() {
    return this.metrics;
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
