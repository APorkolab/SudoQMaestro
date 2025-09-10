import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

describe('App', () => {
  beforeEach(async () => {
    const mockAuthService = {
      currentUser: signal(null),
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      checkAuthStatus: jasmine.createSpy('checkAuthStatus')
    };
    
    const mockNotificationService = {
      message: signal(null),
      type: signal('info' as 'info' | 'success' | 'warning' | 'error'),
      show: jasmine.createSpy('show'),
      showError: jasmine.createSpy('showError'),
      showSuccess: jasmine.createSpy('showSuccess'),
      showWarning: jasmine.createSpy('showWarning'),
      clear: jasmine.createSpy('clear')
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('SudoQMaestro');
  });
});
