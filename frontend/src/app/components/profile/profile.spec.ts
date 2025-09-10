import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfileComponent } from './profile';
import { AuthService } from '../../services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['fetchCurrentUser', 'logout', 'isAuthenticated'], {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null)
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have authService injected', () => {
    expect(component.authService).toBeTruthy();
    expect(component.authService).toBe(authService);
  });

  it('should render component without error', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
