import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  loadTime?: number;
  domInteractive?: number;
  domComplete?: number;
  
  // Custom application metrics
  puzzleGenerationTime?: number;
  imageUploadTime?: number;
  solveTime?: number;
  
  // Resource loading
  resourceLoadTimes?: ResourceTiming[];
  
  // User engagement
  timeOnPage?: number;
  userInteractions?: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other';
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private router = inject(Router);
  private metrics: PerformanceMetrics = {};
  private pageLoadStartTime: number = performance.now();
  private isSupported: boolean;
  
  // Configuration
  private config = {
    enabled: true,
    sampleRate: 1.0, // 100% sampling for development, reduce for production
    enableResourceTiming: true,
    enableUserTiming: true,
    enableLongTasks: true,
    reportingEndpoint: '/api/analytics/performance',
    batchSize: 10,
    maxBatchDelay: 30000 // 30 seconds
  };

  private metricsQueue: Record<string, unknown>[] = [];
  private observer?: PerformanceObserver;
  private longTaskObserver?: PerformanceObserver;

  constructor() {
    this.isSupported = this.checkSupport();
    
    if (this.isSupported && this.config.enabled) {
      this.initializeMonitoring();
      this.setupRouterTracking();
      this.measureCoreWebVitals();
      this.startResourceMonitoring();
      this.startLongTaskMonitoring();
    }
  }

  private checkSupport(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      'performance' in window &&
      'PerformanceObserver' in window &&
      'requestIdleCallback' in window
    );
  }

  private initializeMonitoring(): void {
    // Measure initial page load metrics
    window.addEventListener('load', () => {
      this.measurePageLoad();
    });

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });

    // Send metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, this.config.maxBatchDelay);
  }

  private setupRouterTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.onRouteChange(event.url);
      });
  }

  private measureCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1];
      this.metrics.lcp = lcpEntry.startTime;
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fidEntry = entries[0] as PerformanceEventTiming;
      this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
    });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      entries.forEach((entry: PerformanceEntry & { hadRecentInput?: boolean; value?: number }) => {
        if (!entry.hadRecentInput) {
          clsScore += (entry.value || 0);
        }
      });
      this.metrics.cls = clsScore;
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    });
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Performance observation for ${type} not supported:`, error);
    }
  }

  private measurePageLoad(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domInteractive = navigation.domInteractive - navigation.fetchStart;
      this.metrics.domComplete = navigation.domComplete - navigation.fetchStart;
    }

    this.queueMetrics({
      ...this.metrics,
      url: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    } as Record<string, unknown>);
  }

  private startResourceMonitoring(): void {
    if (!this.config.enableResourceTiming) return;

    this.observePerformanceEntry('resource', (entries) => {
      const resourceTimings: ResourceTiming[] = entries.map(entry => {
        const resourceEntry = entry as PerformanceResourceTiming;
        return {
          name: resourceEntry.name,
          duration: resourceEntry.responseEnd - resourceEntry.startTime,
          size: resourceEntry.transferSize || 0,
          type: this.getResourceType(resourceEntry.name)
        };
      });

      this.metrics.resourceLoadTimes = [
        ...(this.metrics.resourceLoadTimes || []),
        ...resourceTimings
      ];
    });
  }

  private startLongTaskMonitoring(): void {
    if (!this.config.enableLongTasks) return;

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Report long tasks that block the main thread
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.trackCustomMetric('long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              url: window.location.pathname
            });
          }
        });
      });
      
      this.longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }

  private getResourceType(url: string): ResourceTiming['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
    if (url.includes('/api/')) return 'fetch';
    return 'other';
  }

  private onRouteChange(url: string): void {
    // Reset page-specific metrics
    this.pageLoadStartTime = performance.now();
    this.metrics = {
      timeOnPage: performance.now() - this.pageLoadStartTime
    };

    this.trackPageView(url);
  }

  // Public methods for custom tracking
  public trackPuzzleGeneration(difficulty: string, duration: number): void {
    this.trackCustomMetric('puzzle-generation', {
      difficulty,
      duration,
      timestamp: Date.now()
    });
  }

  public trackImageUpload(fileSize: number, duration: number, success: boolean): void {
    this.trackCustomMetric('image-upload', {
      fileSize,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  public trackPuzzleSolve(difficulty: string, duration: number, completed: boolean): void {
    this.trackCustomMetric('puzzle-solve', {
      difficulty,
      duration,
      completed,
      timestamp: Date.now()
    });
  }

  public trackUserInteraction(action: string, element?: string, value?: unknown): void {
    this.trackCustomMetric('user-interaction', {
      action,
      element,
      value,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  }

  public trackError(error: Error | string | unknown, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : 
                        typeof error === 'string' ? error : 
                        'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.trackCustomMetric('error', {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    });
  }

  public trackPageView(url: string): void {
    this.trackCustomMetric('page-view', {
      url,
      timestamp: Date.now(),
      referrer: document.referrer,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  private trackCustomMetric(name: string, data: Record<string, unknown>): void {
    if (this.config.enableUserTiming) {
      performance.mark(`custom-${name}-${Date.now()}`);
    }

    this.queueMetrics({
      type: name,
      data,
      timestamp: Date.now()
    });
  }

  private queueMetrics(metrics: Record<string, unknown>): void {
    // Sample rate control
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.metricsQueue.push(metrics);

    if (this.metricsQueue.length >= this.config.batchSize) {
      this.flushMetrics();
    }
  }

  private flushMetrics(): void {
    if (this.metricsQueue.length === 0) {
      return;
    }

    const metricsToSend = [...this.metricsQueue];
    this.metricsQueue = [];

    // Send metrics to backend
    this.sendMetrics(metricsToSend);
  }

  private async sendMetrics(metrics: Record<string, unknown>[]): Promise<void> {
    try {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon && typeof document !== 'undefined') {
        const data = JSON.stringify({ metrics });
        navigator.sendBeacon(this.config.reportingEndpoint, data);
      } else {
        // Fallback to fetch
        await fetch(this.config.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ metrics })
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  // Utility methods
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public startTiming(name: string): void {
    performance.mark(`${name}-start`);
  }

  public endTiming(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    return measure ? measure.duration : 0;
  }

  public clearTiming(name: string): void {
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  // Configuration methods
  public configure(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
  }

  public disable(): void {
    this.config.enabled = false;
    this.observer?.disconnect();
    this.longTaskObserver?.disconnect();
  }
}
