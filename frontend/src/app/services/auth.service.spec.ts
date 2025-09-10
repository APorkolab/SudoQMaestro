import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://localhost:5000/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch current user successfully', () => {
    const mockUser: User = {
      googleId: '12345',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date()
    };

    service.fetchCurrentUser().subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/current-user`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockUser);
  });

  it('should handle authentication error gracefully', () => {
    service.fetchCurrentUser().subscribe(user => {
      expect(user).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    const req = httpTestingController.expectOne(`${apiUrl}/current-user`);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should check if user is authenticated', () => {
    // Initially undefined (not loaded)
    expect(service.isAuthenticated()).toBe(false);
    
    // Mock setting a user
    service.fetchCurrentUser().subscribe();
    const req = httpTestingController.expectOne(`${apiUrl}/current-user`);
    req.flush({
      googleId: '12345',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date()
    });

    expect(service.isAuthenticated()).toBe(true);
  });

  it('should check if user is admin', () => {
    const adminUser: User = {
      googleId: '12345',
      displayName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date()
    };

    service.fetchCurrentUser().subscribe();
    const req = httpTestingController.expectOne(`${apiUrl}/current-user`);
    req.flush(adminUser);

    expect(service.isAdmin()).toBe(true);
  });

  it('should have loginWithGoogle method', () => {
    expect(service.loginWithGoogle).toBeDefined();
    expect(typeof service.loginWithGoogle).toBe('function');
  });

  it('should have logout method', () => {
    expect(service.logout).toBeDefined();
    expect(typeof service.logout).toBe('function');
  });
});
