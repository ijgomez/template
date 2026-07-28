import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Functional guard that protects routes requiring specific actions.
 * Reads required actions from route data (route.data['actions'] as string[]).
 * Allows navigation if the user has at least one of the required actions (OR logic).
 * Redirects to /dashboard if the user lacks all required actions.
 */
export const actionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredActions: string[] = route.data?.['actions'] ?? [];

  if (requiredActions.length === 0) {
    return true;
  }

  const hasAtLeastOne = requiredActions.some((action) => authService.hasAction(action));

  if (hasAtLeastOne) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
