import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, retry, timer } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { NetworkError, AuthenticationError } from '../services/error-handler.service';

/**
 * HTTP error interceptor that handles API errors consistently
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    // Retry failed requests (except for client errors 4xx)
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry for server errors (5xx) and network errors
        if (error.status >= 500 || error.status === 0) {
          // Exponential backoff: 1s, 2s, 4s...
          const delayMs = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying request in ${delayMs}ms (attempt ${retryCount + 1})`);
          return timer(delayMs);
        }
        
        // Don't retry client errors
        throw error;
      }
    }),
    
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'An unexpected error occurred.';
      let customError: Error;

      // Handle different HTTP error status codes
      switch (error.status) {
        case 0:
          // Network error or CORS issue
          userMessage = 'Unable to connect to the server. Please check your internet connection.';
          customError = new NetworkError(userMessage, 0, error);
          break;
          
        case 400:
          // Bad Request
          userMessage = error.error?.error || error.error?.message || 'Invalid request. Please check your input.';
          customError = new Error(userMessage);
          break;
          
        case 401:
          // Unauthorized
          userMessage = 'Authentication required. Please log in.';
          customError = new AuthenticationError(userMessage);
          break;
          
        case 403:
          // Forbidden
          userMessage = 'You do not have permission to perform this action.';
          customError = new Error(userMessage);
          break;
          
        case 404:
          // Not Found
          userMessage = 'The requested resource was not found.';
          customError = new Error(userMessage);
          break;
          
        case 409:
          // Conflict
          userMessage = error.error?.error || 'A conflict occurred. The resource may already exist.';
          customError = new Error(userMessage);
          break;
          
        case 413:
          // Payload Too Large
          userMessage = 'The file is too large. Please select a smaller file.';
          customError = new Error(userMessage);
          break;
          
        case 422:
          // Unprocessable Entity (Validation Error)
          if (error.error?.details && Array.isArray(error.error.details)) {
            const validationErrors = error.error.details
              .map((detail: { field: string; message: string }) => `${detail.field}: ${detail.message}`)
              .join(', ');
            userMessage = `Validation failed: ${validationErrors}`;
          } else {
            userMessage = error.error?.error || 'Validation failed. Please check your input.';
          }
          customError = new Error(userMessage);
          break;
          
        case 429: {
          // Too Many Requests (Rate Limited)
          const retryAfter = error.headers.get('Retry-After');
          const retryText = retryAfter ? ` Please try again in ${retryAfter} seconds.` : ' Please try again later.';
          userMessage = (error.error?.error || 'Too many requests.') + retryText;
          customError = new Error(userMessage);
          break;
        }
          
        case 500:
          // Internal Server Error
          userMessage = 'A server error occurred. Our team has been notified.';
          customError = new NetworkError(userMessage, 500, error);
          break;
          
        case 502:
        case 503:
        case 504:
          // Bad Gateway, Service Unavailable, Gateway Timeout
          userMessage = 'The server is temporarily unavailable. Please try again later.';
          customError = new NetworkError(userMessage, error.status, error);
          break;
          
        default:
          // Other errors
          if (error.status >= 500) {
            userMessage = 'A server error occurred. Please try again later.';
          } else if (error.status >= 400) {
            userMessage = error.error?.error || error.error?.message || 'An error occurred with your request.';
          }
          customError = new NetworkError(userMessage, error.status, error);
      }

      // Log error details for debugging
      console.group('🌐 HTTP Error Intercepted');
      console.error('Status:', error.status);
      console.error('URL:', error.url);
      console.error('Error:', error.error);
      console.error('Headers:', error.headers);
      console.groupEnd();

      // Show user notification for specific error types
      if (shouldShowNotification(error.status)) {
        notificationService.showError(userMessage);
      }

      // Return the custom error for component handling
      return throwError(() => customError);
    })
  );
};

/**
 * Determine if we should show a notification for this error status
 */
function shouldShowNotification(status: number): boolean {
  // Don't show notifications for these status codes as they're often handled by components
  const silentErrors = [400, 401, 404, 422]; // Bad Request, Unauthorized, Not Found, Validation
  return !silentErrors.includes(status);
}
