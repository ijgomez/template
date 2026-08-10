import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Functional guard that protects routes requiring authentication.
 *
 * If the session has already been restored (APP_INITIALIZER completed),
 * performs a synchronous check. Otherwise, attempts to restore the session
 * before deciding — this prevents incorrect redirects to login during startup.
 *
 * Redirects unauthenticated users to /login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If session restore already completed, check synchronously
  if (authService.isSessionRestored()) {
    if (authService.isAuthenticated()) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  }

  // Session not yet restored — attempt recovery before deciding
  return authService.tryRestoreSession().pipe(
    map((restored) => {
      if (restored && authService.isAuthenticated()) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    }),
  );
};
