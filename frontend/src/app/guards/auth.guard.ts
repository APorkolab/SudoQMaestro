import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user === undefined) {
    return authService.fetchCurrentUser().pipe(
      map(loadedUser => {
        if (loadedUser) {
          return true;
        } else {
          router.navigate(['/']);
          return false;
        }
      })
    );
  }

  if (user) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
