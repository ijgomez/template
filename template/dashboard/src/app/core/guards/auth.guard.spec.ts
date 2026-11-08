import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    isSessionRestored: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
      // La sesión ya está restaurada: el guard toma el camino síncrono.
      isSessionRestored: vi.fn().mockReturnValue(true),
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

  it('should allow navigation when user is authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('when the session has not been restored yet', () => {
    let tryRestoreSession: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      authServiceMock.isSessionRestored.mockReturnValue(false);
      tryRestoreSession = vi.fn();
      (authServiceMock as unknown as { tryRestoreSession: unknown }).tryRestoreSession = tryRestoreSession;
    });

    it('should allow navigation when the session is restored and authenticated', async () => {
      tryRestoreSession.mockReturnValue(of(true));
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(await firstValueFrom(result as Observable<boolean>)).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /login when the session cannot be restored', async () => {
      tryRestoreSession.mockReturnValue(of(false));
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(await firstValueFrom(result as Observable<boolean>)).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to /login when restored but still not authenticated', async () => {
      tryRestoreSession.mockReturnValue(of(true));
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(await firstValueFrom(result as Observable<boolean>)).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
