import { Injectable, signal } from '@angular/core';

/**
 * Simple notification service using Signals
 * Displays global messages that can be shown in a toast/snackbar component
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Current message state
  message = signal<string | null>(null);
  type = signal<'info' | 'success' | 'warning' | 'error'>('info');

  // Duration for message display (in milliseconds)
  private duration = 5000;
  private timeoutRef: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.type.set(type);
    this.message.set(message);

    // Auto-clear after duration
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    this.timeoutRef = setTimeout(() => this.clear(), this.duration);
  }

  showError(message: string): void {
    this.show(message, 'error');
  }

  showSuccess(message: string): void {
    this.show(message, 'success');
  }

  showWarning(message: string): void {
    this.show(message, 'warning');
  }

  clear(): void {
    this.message.set(null);
  }
}

