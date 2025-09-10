import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasError()) {
      <div class="error-boundary">
        <div class="error-boundary__content">
          <div class="error-boundary__icon">⚠️</div>
          <h3 class="error-boundary__title">{{ title }}</h3>
          <p class="error-boundary__message">{{ message }}</p>
          
          @if (showDetails && errorDetails()) {
            <details class="error-boundary__details">
              <summary>Error Details (for developers)</summary>
              <pre class="error-boundary__error">{{ errorDetails() }}</pre>
            </details>
          }
          
          <div class="error-boundary__actions">
            <button 
              class="error-boundary__button error-boundary__button--primary"
              (click)="retry()"
            >
              Try Again
            </button>
            
            <button 
              class="error-boundary__button error-boundary__button--secondary"
              (click)="reload()"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    .error-boundary {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      padding: 2rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .error-boundary__content {
      text-align: center;
      max-width: 500px;
    }

    .error-boundary__icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-boundary__title {
      color: #991b1b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .error-boundary__message {
      color: #7f1d1d;
      font-size: 1rem;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }

    .error-boundary__details {
      text-align: left;
      margin-bottom: 1.5rem;
      background: #fee2e2;
      border-radius: 4px;
      padding: 1rem;
    }

    .error-boundary__details summary {
      color: #991b1b;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }

    .error-boundary__error {
      font-size: 0.8rem;
      color: #7f1d1d;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    .error-boundary__actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .error-boundary__button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .error-boundary__button--primary {
      background: #dc2626;
      color: white;
    }

    .error-boundary__button--primary:hover {
      background: #b91c1c;
    }

    .error-boundary__button--secondary {
      background: white;
      color: #dc2626;
      border: 1px solid #dc2626;
    }

    .error-boundary__button--secondary:hover {
      background: #fef2f2;
    }

    @media (max-width: 640px) {
      .error-boundary {
        padding: 1rem;
      }

      .error-boundary__actions {
        flex-direction: column;
        align-items: stretch;
      }

      .error-boundary__button {
        width: 100%;
      }
    }
  `]
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  @Input() title = 'Something went wrong';
  @Input() message = 'An unexpected error occurred. Please try again or reload the page.';
  @Input() showDetails = false;

  hasError = signal(false);
  errorDetails = signal<string | null>(null);

  private originalHandler: Window['onerror'] | null = null;
  private originalUnhandledRejection: Window['onunhandledrejection'] | null = null;

  ngOnInit() {
    // Catch unhandled errors in the component tree
    this.setupErrorHandlers();
  }

  ngOnDestroy() {
    this.restoreErrorHandlers();
  }

  private setupErrorHandlers() {
    // Store original handlers
    this.originalHandler = window.onerror;
    this.originalUnhandledRejection = window.onunhandledrejection;

    // Override error handlers to catch errors in this boundary
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(message?.toString() || 'Unknown error'));
      
      // Call original handler if it exists
      if (this.originalHandler) {
        return this.originalHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    window.onunhandledrejection = (event) => {
      this.handleError(event.reason);
      
      // Call original handler if it exists
      if (this.originalUnhandledRejection) {
        return this.originalUnhandledRejection(event);
      }
    };
  }

  private restoreErrorHandlers() {
    window.onerror = this.originalHandler;
    window.onunhandledrejection = this.originalUnhandledRejection;
  }

  handleError(error: unknown) {
    console.error('Error boundary caught error:', error);
    
    this.hasError.set(true);
    
    if (this.showDetails && error) {
      const errorText = error.stack || error.message || error.toString();
      this.errorDetails.set(errorText);
    }
  }

  retry() {
    this.hasError.set(false);
    this.errorDetails.set(null);
    
    // Allow component to re-render
    setTimeout(() => {
      // Component content will be shown again
    }, 0);
  }

  reload() {
    window.location.reload();
  }

  // Public method to manually trigger error state
  triggerError(error: unknown) {
    this.handleError(error);
  }
}
