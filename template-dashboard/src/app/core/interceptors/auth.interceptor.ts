import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * URLs that should NOT have the Authorization header attached.
 * These are public authentication endpoints.
 */
const AUTH_SKIP_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Shared state for token refresh coordination.
 * Prevents multiple concurrent refresh requests when several HTTP calls
 * detect token expiration simultaneously.
 */
let isRefreshing = false;
let refreshSubject$ = new BehaviorSubject<string | null>(null);

/**
 * Resets the refresh state. Exported for testing purposes.
 */
export function resetRefreshState(): void {
  isRefreshing = false;
  refreshSubject$ = new BehaviorSubject<string | null>(null);
}

/**
 * Determines if a URL is an authentication endpoint that should skip interception.
 */
function isAuthEndpoint(url: string): boolean {
  return AUTH_SKIP_URLS.some((path) => url.includes(path));
}

/**
 * Checks whether the access token is near expiration based on the configured margin.
 * Returns true if the token will expire within `tokenRefreshMargin` milliseconds.
 */
function isTokenNearExpiry(authService: AuthService): boolean {
  const user = authService.getCurrentUser();
  if (!user) {
    return false;
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const marginInSeconds = environment.tokenRefreshMargin / 1000;
  return user.exp - nowInSeconds < marginInSeconds;
}

/**
 * Clones a request with the Authorization Bearer header attached.
 */
function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Angular 22 functional HTTP interceptor for JWT authentication.
 *
 * Responsibilities:
 * - Attaches Authorization: Bearer header to non-auth requests
 * - Proactively refreshes token when near expiry
 * - Queues concurrent requests during a refresh cycle
 * - Handles error responses: 401, 403, 4xx, 5xx, network errors
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth endpoints to avoid infinite loops
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();

  // No token available — send request as-is
  if (!token) {
    return next(req).pipe(catchError((error) => handleHttpError(error)));
  }

  // Token is near expiry — proactively refresh before sending
  if (isTokenNearExpiry(authService)) {
    return handleTokenRefresh(req, next, authService, router);
  }

  // Token is valid — attach header and proceed
  return next(addAuthHeader(req, token)).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handleTokenRefresh(req, next, authService, router);
      }
      return handleHttpError(error);
    }),
  );
};

/**
 * Handles the token refresh flow.
 * If a refresh is already in progress, queues the request to be retried
 * once the new token is available.
 */
function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<any> {
  if (isRefreshing) {
    // Wait for the ongoing refresh to complete
    return refreshSubject$.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addAuthHeader(req, token!))),
      catchError((error) => handleHttpError(error)),
    );
  }

  isRefreshing = true;
  refreshSubject$.next(null);

  return authService.refreshToken().pipe(
    switchMap((response) => {
      isRefreshing = false;
      refreshSubject$.next(response.accessToken);
      return next(addAuthHeader(req, response.accessToken));
    }),
    catchError((error) => {
      isRefreshing = false;
      refreshSubject$.next(null);
      authService.logout().subscribe({
        complete: () => router.navigate(['/login']),
        error: () => router.navigate(['/login']),
      });
      return throwError(() => error);
    }),
  );
}

/**
 * Centralized HTTP error handler implementing the error pipeline.
 *
 * Error classification:
 * - 401: handled upstream via refresh logic (never reaches here)
 * - 403: propagate with access denied indicator
 * - 4xx: propagate with server-provided message
 * - 5xx: wrap with generic server error key
 * - Network errors (status 0 or non-HttpErrorResponse): mark as offline
 *
 * The error objects use i18n translation keys where applicable.
 * The notification service is responsible for resolving keys to localized strings.
 */
function handleHttpError(error: HttpErrorResponse | Error): Observable<never> {
  if (!(error instanceof HttpErrorResponse)) {
    // Network error (no HTTP response received)
    return throwError(() => ({
      status: 0,
      messageKey: 'error.network',
      message: error.message,
      offline: true,
      originalError: error,
    }));
  }

  if (error.status === 0) {
    // Status 0 in HttpErrorResponse indicates network failure
    return throwError(() => ({
      status: 0,
      messageKey: 'error.network',
      message: error.message,
      offline: true,
      originalError: error,
    }));
  }

  if (error.status === 403) {
    return throwError(() => ({
      status: 403,
      messageKey: 'error.forbidden',
      message: error.error?.message ?? null,
      originalError: error,
    }));
  }

  if (error.status >= 400 && error.status < 500) {
    return throwError(() => ({
      status: error.status,
      messageKey: 'error.client',
      message: error.error?.message ?? null,
      originalError: error,
    }));
  }

  if (error.status >= 500) {
    return throwError(() => ({
      status: error.status,
      messageKey: 'error.server',
      message: error.error?.message ?? null,
      originalError: error,
    }));
  }

  return throwError(() => ({
    status: error.status,
    messageKey: 'error.unknown',
    message: error.message,
    originalError: error,
  }));
}
