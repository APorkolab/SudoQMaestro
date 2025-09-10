import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, of } from 'rxjs';

export interface User {
  googleId: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/auth';
  
  private currentUserSignal: WritableSignal<User | null | undefined> = signal(undefined);

  currentUser = this.currentUserSignal.asReadonly();

  /**
   * Fetches the current user from the backend
   */
  fetchCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/current-user`).pipe(
      tap(user => this.currentUserSignal.set(user)),
      catchError(error => {
        console.log('User not authenticated:', error);
        this.currentUserSignal.set(null);
        return of(null);
      })
    );
  }

  /**
   * Initiates Google OAuth login
   */
  login(): void {
    this.loginWithGoogle();
  }
  
  /**
   * Initiates Google OAuth login
   */
  loginWithGoogle(): void {
    if (typeof window !== 'undefined') {
      window.location.href = `${this.apiUrl}/google`;
    }
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      window.location.href = `${this.apiUrl}/logout`;
    }
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.currentUserSignal();
    return user !== null && user !== undefined;
  }

  /**
   * Checks if user has admin role
   */
  isAdmin(): boolean {
    const user = this.currentUserSignal();
    return user?.role === 'admin';
  }
}
