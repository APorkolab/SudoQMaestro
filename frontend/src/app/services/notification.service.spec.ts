import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no message', () => {
    expect(service.message()).toBeNull();
    expect(service.type()).toBe('info');
  });

  it('should show info message', () => {
    service.show('Test message', 'info');
    
    expect(service.message()).toBe('Test message');
    expect(service.type()).toBe('info');
  });

  it('should show error message', () => {
    service.showError('Error message');
    
    expect(service.message()).toBe('Error message');
    expect(service.type()).toBe('error');
  });

  it('should show success message', () => {
    service.showSuccess('Success message');
    
    expect(service.message()).toBe('Success message');
    expect(service.type()).toBe('success');
  });

  it('should show warning message', () => {
    service.showWarning('Warning message');
    
    expect(service.message()).toBe('Warning message');
    expect(service.type()).toBe('warning');
  });

  it('should clear message', () => {
    service.show('Test message');
    service.clear();
    
    expect(service.message()).toBeNull();
  });

  it('should auto-clear message after timeout', fakeAsync(() => {
    // Override the duration for faster testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).duration = 100;
    
    service.show('Test message');
    expect(service.message()).toBe('Test message');
    
    tick(150);
    expect(service.message()).toBeNull();
  }));

  it('should cancel previous timeout when showing new message', fakeAsync(() => {
    // Override the duration for faster testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).duration = 100;
    
    service.show('First message');
    
    tick(50);
    service.show('Second message');
    expect(service.message()).toBe('Second message');
    
    tick(150);
    expect(service.message()).toBeNull();
  }));
});
