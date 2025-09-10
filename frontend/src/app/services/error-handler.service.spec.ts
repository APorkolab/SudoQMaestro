import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandler, SudokuError, ValidationError, NetworkError } from './error-handler.service';
import { NotificationService } from './notification.service';

describe('GlobalErrorHandler', () => {
  let service: GlobalErrorHandler;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(GlobalErrorHandler);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle API errors with structured response', () => {
    const error = {
      error: {
        error: 'Validation failed'
      }
    };

    spyOn(console, 'error');
    service.handleError(error);

    expect(notificationService.showError).toHaveBeenCalledWith('Validation failed');
  });

  it('should handle user-friendly errors', () => {
    const error = new Error('Unauthorized access');

    spyOn(console, 'error');
    service.handleError(error);

    expect(notificationService.showError).toHaveBeenCalledWith('Unauthorized access');
  });

  it('should handle chunk load errors', () => {
    const error = new Error('Loading chunk failed');
    (error as { name?: string }).name = 'ChunkLoadError';

    spyOn(console, 'error');
    service.handleError(error);

    expect(notificationService.showError).toHaveBeenCalledWith('Failed to load application resources. Please refresh the page.');
  });

  it('should handle network errors', () => {
    const error = new TypeError('Failed to fetch');
    (error as { name?: string }).name = 'TypeError';

    spyOn(console, 'error');
    service.handleError(error);

    expect(notificationService.showError).toHaveBeenCalledWith('Network connection error. Please check your internet connection.');
  });

  it('should handle generic errors', () => {
    const error = new Error('Something went wrong');

    spyOn(console, 'error');
    service.handleError(error);

    expect(notificationService.showError).toHaveBeenCalledWith('An unexpected error occurred. Please try again.');
  });

  describe('Custom Error Classes', () => {
    it('should create SudokuError with details', () => {
      const error = new SudokuError('Invalid puzzle', 'INVALID_GRID', { grid: [] });
      
      expect(error.name).toBe('SudokuError');
      expect(error.message).toBe('Invalid puzzle');
      expect(error.code).toBe('INVALID_GRID');
      expect(error.details).toEqual({ grid: [] });
    });

    it('should create ValidationError with field info', () => {
      const error = new ValidationError('Required field', 'email', 'test');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Required field');
      expect(error.field).toBe('email');
      expect(error.value).toBe('test');
    });

    it('should create NetworkError with status code', () => {
      const error = new NetworkError('Server error', 500, { details: 'timeout' });
      
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual({ details: 'timeout' });
    });
  });
});
