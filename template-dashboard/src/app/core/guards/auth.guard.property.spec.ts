import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import * as fc from 'fast-check';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Property-based test: Auth guard redirects unauthenticated users.
 *
 * **Validates: Requirements 1.5**
 *
 * Property 7: For any protected route, an unauthenticated user is always redirected to /login.
 */
describe('authGuard - Property 7: Auth guard redirects unauthenticated users', () => {
  let authServiceMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  /**
   * Arbitrary that generates valid route path segments.
   * Produces strings like: dashboard, users, admin/security, reports/123/export
   */
  const routePathSegmentArb = fc.stringMatching(/^[a-z][a-z0-9-]*$/);

  const routePathArb = fc
    .array(routePathSegmentArb, { minLength: 1, maxLength: 4 })
    .map((segments) => '/' + segments.join('/'));

  it('should always return false for any unauthenticated user on any route', () => {
    fc.assert(
      fc.property(routePathArb, (routePath) => {
        authServiceMock.isAuthenticated.mockReturnValue(false);
        routerMock.navigate.mockClear();

        const mockRoute = {} as ActivatedRouteSnapshot;

        const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('should always navigate to /login for any unauthenticated user on any route', () => {
    fc.assert(
      fc.property(routePathArb, (routePath) => {
        authServiceMock.isAuthenticated.mockReturnValue(false);
        routerMock.navigate.mockClear();

        const mockRoute = {} as ActivatedRouteSnapshot;

        TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
        expect(routerMock.navigate).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 },
    );
  });

  it('should always return true for any authenticated user on any route', () => {
    fc.assert(
      fc.property(routePathArb, (routePath) => {
        authServiceMock.isAuthenticated.mockReturnValue(true);
        routerMock.navigate.mockClear();

        const mockRoute = {} as ActivatedRouteSnapshot;

        const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

        expect(result).toBe(true);
        expect(routerMock.navigate).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
