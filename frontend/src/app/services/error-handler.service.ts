import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * Global error handler for the application
 * Catches all unhandled errors and provides user-friendly feedback
 */
@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private notificationService = inject(NotificationService);

  handleError(error: unknown): void {
    console.error('Global error caught:', error);

    // Extract meaningful error message
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    // Handle different types of errors
    if (error?.error?.error) {
      // API error with structured response
      userMessage = error.error.error;
    } else if (error?.message) {
      // Standard error with message
      if (this.isUserFriendlyError(error.message)) {
        userMessage = error.message;
      }
    } else if (error?.name === 'ChunkLoadError') {
      // Code splitting/lazy loading errors
      userMessage = 'Failed to load application resources. Please refresh the page.';
    } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      // Network errors
      userMessage = 'Network connection error. Please check your internet connection.';
    }

    // Show user-friendly notification
    this.notificationService.showError(userMessage);

    // Log detailed error for debugging (only in development)
    if (!this.isProduction()) {
      console.group('🚨 Global Error Details');
      console.error('Original error:', error);
      console.error('Stack trace:', error?.stack);
      console.error('Error type:', error?.constructor?.name);
      console.groupEnd();
    }

    // In production, consider sending error to monitoring service
    if (this.isProduction()) {
      this.logToMonitoringService(error, userMessage);
    }
  }

  private isUserFriendlyError(message: string): boolean {
    // Define patterns for user-friendly errors
    const userFriendlyPatterns = [
      /validation/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /timeout/i,
      /rate limit/i
    ];

    return userFriendlyPatterns.some(pattern => pattern.test(message));
  }

  private isProduction(): boolean {
    // Check if running in production mode
    // This can be customized based on your environment detection
    return !window.location.hostname.includes('localhost') && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('dev');
  }

  private logToMonitoringService(error: unknown, userMessage: string): void {
    // Placeholder for monitoring service integration
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    const errorData = {
      message: userMessage,
      originalError: error?.message || 'Unknown error',
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name || 'Unknown'
    };

    // In a real implementation, you would send this to your monitoring service
    console.warn('Error logged to monitoring service:', errorData);
  }
}

/**
 * Custom error classes for application-specific errors
 */
export class SudokuError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SudokuError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
