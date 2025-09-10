import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService, User } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  
  const mockUser: User = {
    googleId: '12345',
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date()
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser', 'fetchCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when user is authenticated', () => {
    authService.currentUser.and.returnValue(mockUser);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to home when user is not authenticated', () => {
    authService.currentUser.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should fetch user when currentUser is undefined and allow access', (done) => {
    authService.currentUser.and.returnValue(undefined);
    authService.fetchCurrentUser.and.returnValue(of(mockUser));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    if (typeof result === 'object' && 'subscribe' in result) {
      (result as unknown as { subscribe: (callback: (canActivate: boolean) => void) => void }).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(authService.fetchCurrentUser).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    }
  });

  it('should fetch user when currentUser is undefined and redirect if no user', (done) => {
    authService.currentUser.and.returnValue(undefined);
    authService.fetchCurrentUser.and.returnValue(of(null));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    if (typeof result === 'object' && 'subscribe' in result) {
      (result as unknown as { subscribe: (callback: (canActivate: boolean) => void) => void }).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(authService.fetchCurrentUser).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    }
  });
});
