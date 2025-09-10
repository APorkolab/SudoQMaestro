import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notificationService.message()) {
      <div 
        class="notification"
        [class]="'notification--' + notificationService.type()"
        role="alert"
        aria-live="polite"
      >
        <div class="notification__content">
          <span class="notification__icon">{{ getIcon() }}</span>
          <span class="notification__message">{{ notificationService.message() }}</span>
          <button 
            class="notification__close" 
            (click)="notificationService.clear()"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .notification {
      position: fixed;
      top: 1rem;
      right: 1rem;
      min-width: 300px;
      max-width: 500px;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .notification__content {
      display: flex;
      align-items: center;
      padding: 1rem;
      gap: 0.75rem;
    }

    .notification__icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .notification__message {
      flex-grow: 1;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .notification__close {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      flex-shrink: 0;
    }

    .notification__close:hover {
      opacity: 1;
    }

    /* Notification types */
    .notification--error {
      background: #fee2e2;
      border-left: 4px solid #dc2626;
      color: #7f1d1d;
    }

    .notification--error .notification__close {
      color: #7f1d1d;
    }

    .notification--success {
      background: #dcfce7;
      border-left: 4px solid #16a34a;
      color: #14532d;
    }

    .notification--success .notification__close {
      color: #14532d;
    }

    .notification--warning {
      background: #fef3c7;
      border-left: 4px solid #d97706;
      color: #92400e;
    }

    .notification--warning .notification__close {
      color: #92400e;
    }

    .notification--info {
      background: #dbeafe;
      border-left: 4px solid #2563eb;
      color: #1e3a8a;
    }

    .notification--info .notification__close {
      color: #1e3a8a;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .notification {
        left: 1rem;
        right: 1rem;
        min-width: auto;
        max-width: none;
      }
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);

  getIcon(): string {
    const icons = {
      error: '🚨',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[this.notificationService.type()];
  }
}
