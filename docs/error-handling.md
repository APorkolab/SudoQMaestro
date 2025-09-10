# Error Handling System

This document describes the comprehensive error handling system implemented in the SudoQMaestro application.

## Overview

The error handling system provides multiple layers of error management:

1. **Global Error Handler** - Catches all unhandled errors and provides user-friendly feedback
2. **HTTP Error Interceptor** - Handles API errors consistently with retry logic and proper status code handling
3. **Error Boundary Components** - React-like error boundaries for catching component-level errors
4. **Notification System** - Global notification service for displaying user-friendly messages
5. **Component-Level Error Handling** - Local error states and user feedback in individual components

## Architecture

### Global Error Handler (`GlobalErrorHandler`)

The global error handler implements Angular's `ErrorHandler` interface and:

- Catches all unhandled JavaScript errors
- Provides user-friendly error messages
- Logs detailed error information for debugging
- Differentiates between development and production environments
- Integrates with monitoring services (configurable)

**Features:**
- Handles specific error types (ChunkLoadError, TypeError, etc.)
- Filters user-friendly vs technical errors
- Shows appropriate notifications
- Logs to monitoring service in production

### HTTP Error Interceptor (`errorInterceptor`)

The HTTP interceptor handles all API communication errors:

**Retry Logic:**
- Automatic retry for server errors (5xx) and network errors
- Exponential backoff (1s, 2s, 4s...)
- No retry for client errors (4xx)

**Status Code Handling:**
- `0` - Network/CORS errors
- `400` - Bad Request with validation details
- `401` - Authentication required
- `403` - Permission denied
- `404` - Resource not found
- `409` - Conflict/duplicate resource
- `413` - File too large
- `422` - Validation errors with field details
- `429` - Rate limiting with retry-after info
- `500+` - Server errors

**Error Transformation:**
- Converts HTTP errors to custom error classes
- Extracts meaningful error messages
- Preserves original error details for debugging

### Error Boundary Component (`ErrorBoundaryComponent`)

Provides React-like error boundary functionality for Angular:

**Features:**
- Catches unhandled errors within component tree
- Shows user-friendly error UI
- Provides retry functionality
- Optional detailed error information for developers
- Graceful fallback UI

**Usage:**
```html
<app-error-boundary 
  title="Custom Error Title"
  message="Custom error message"
  [showDetails]="!isProduction"
>
  <!-- Your components here -->
</app-error-boundary>
```

### Notification Service (`NotificationService`)

Global notification system using Angular Signals:

**Methods:**
- `show(message, type)` - Show general notification
- `showError(message)` - Show error notification
- `showSuccess(message)` - Show success notification
- `showWarning(message)` - Show warning notification
- `clear()` - Clear current notification

**Features:**
- Auto-clear after 5 seconds
- Signal-based reactive updates
- Type-safe notification types
- Timeout management

### Custom Error Classes

**SudokuError**
```typescript
new SudokuError(message, code?, details?)
```
Application-specific errors for Sudoku operations.

**ValidationError**
```typescript
new ValidationError(message, field?, value?)
```
Validation errors with field information.

**NetworkError**
```typescript
new NetworkError(message, statusCode?, response?)
```
Network-related errors with HTTP details.

**AuthenticationError**
```typescript
new AuthenticationError(message?)
```
Authentication and authorization errors.

## Implementation Guide

### 1. Configure Global Error Handling

Add to `app.config.ts`:
```typescript
import { GlobalErrorHandler } from './services/error-handler.service';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideHttpClient(withInterceptors([errorInterceptor]))
  ]
};
```

### 2. Add Notification Component

Add to main app template:
```html
<app-notification></app-notification>
```

### 3. Wrap Components with Error Boundaries

```html
<app-error-boundary>
  <router-outlet></router-outlet>
</app-error-boundary>
```

### 4. Handle Component-Level Errors

```typescript
export class MyComponent {
  private notificationService = inject(NotificationService);
  
  error = signal<string | null>(null);
  isLoading = signal(false);

  performAction() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.service.doSomething().subscribe({
      next: (result) => {
        this.isLoading.set(false);
        this.notificationService.showSuccess('Action completed!');
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.message || 'Action failed';
        this.error.set(message);
        // HTTP interceptor will handle global notification
      }
    });
  }
}
```

### 5. Component Template Error Handling

```html
@if (error()) {
  <div class="error-message" role="alert">
    <span>⚠️</span>
    <span>{{ error() }}</span>
    <button (click)="retry()">Retry</button>
  </div>
}

@if (isLoading()) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
}
```

## Error Message Guidelines

### User-Friendly Messages

**DO:**
- Use plain language
- Explain what happened
- Provide next steps
- Be empathetic

**DON'T:**
- Show technical stack traces
- Use developer jargon
- Blame the user
- Be overly generic

### Examples

**Good:**
- "Unable to save your puzzle. Please check your internet connection and try again."
- "The image file is too large. Please select a smaller image (max 5MB)."
- "Too many requests. Please wait 30 seconds before trying again."

**Bad:**
- "HTTP 500 Internal Server Error"
- "Network request failed with status code 0"
- "Something went wrong"

## Testing Error Handling

### Unit Tests

```typescript
describe('Error Handling', () => {
  it('should handle API errors', () => {
    const error = { status: 400, error: { error: 'Validation failed' } };
    component.handleError(error);
    expect(component.error()).toBe('Validation failed');
  });
});
```

### Integration Tests

Test error scenarios:
- Network disconnection
- Server errors
- Invalid input
- Authentication failures
- Rate limiting

### Manual Testing

- Disconnect network during API calls
- Send invalid data to API
- Test with different error status codes
- Verify error boundaries catch component errors
- Test notification system

## Monitoring and Logging

### Development
- Detailed console logging
- Error stack traces
- Component state information

### Production
- Error aggregation services (Sentry, LogRocket, etc.)
- User-friendly error messages only
- Anonymized error reporting
- Performance impact monitoring

## Best Practices

1. **Progressive Enhancement**
   - Always provide fallback UI
   - Graceful degradation for failed features
   - Offline support considerations

2. **User Experience**
   - Clear error messages
   - Recovery options (retry, reload, alternative actions)
   - Loading states during operations
   - Prevent error cascading

3. **Developer Experience**
   - Comprehensive error logging
   - Easy debugging in development
   - Consistent error handling patterns
   - Good error boundaries placement

4. **Performance**
   - Avoid excessive error logging
   - Efficient error message rendering
   - Proper memory cleanup
   - Rate limit error notifications

5. **Security**
   - Never expose sensitive information in errors
   - Sanitize error messages for production
   - Log security-relevant errors
   - Prevent error-based information disclosure
