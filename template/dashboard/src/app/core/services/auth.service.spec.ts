import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { AccessTokenResponse, LoginRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';

/**
 * Helper to create a fake JWT token with a given payload.
 * The header and signature are static stubs (not verified by the service).
 */
function createFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'fake-signature';
  return `${header}.${body}.${signature}`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const authUrl = `${environment.apiUrl}/auth`;

  const mockPayload = {
    sub: 'admin',
    profile: 'Administrator',
    actions: ['USER_READ', 'USER_WRITE', 'DASHBOARD_READ'],
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  };

  const mockAccessTokenResponse: AccessTokenResponse = {
    accessToken: createFakeJwt(mockPayload),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login', () => {
    it('should call POST /auth/login with withCredentials and store access token', () => {
      const credentials: LoginRequest = { username: 'admin', password: 'secret' };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockAccessTokenResponse);
      });

      const req = httpMock.expectOne(`${authUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAccessTokenResponse);

      expect(service.getAccessToken()).toBe(mockAccessTokenResponse.accessToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should decode the JWT payload and set the current user', () => {
      const credentials: LoginRequest = { username: 'admin', password: 'secret' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${authUrl}/login`);
      req.flush(mockAccessTokenResponse);

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
      expect(user!.profile).toBe('Administrator');
      expect(user!.actions).toEqual(['USER_READ', 'USER_WRITE', 'DASHBOARD_READ']);
    });
  });

  describe('logout', () => {
    it('should call POST /auth/logout with withCredentials and clear tokens', () => {
      // First login
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      // Then logout
      service.logout().subscribe();
      const req = httpMock.expectOne(`${authUrl}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      expect(service.getAccessToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear tokens even if logout request fails', () => {
      // First login
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      // Logout fails
      service.logout().subscribe();
      const req = httpMock.expectOne(`${authUrl}/logout`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.getAccessToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should call POST /auth/refresh with withCredentials and no body', () => {
      // First login
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      const newPayload = { ...mockPayload, exp: mockPayload.exp + 3600 };
      const newResponse: AccessTokenResponse = {
        accessToken: createFakeJwt(newPayload),
      };

      service.refreshToken().subscribe((response) => {
        expect(response).toEqual(newResponse);
      });

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      expect(req.request.withCredentials).toBe(true);
      req.flush(newResponse);

      expect(service.getAccessToken()).toBe(newResponse.accessToken);
    });
  });

  describe('tryRestoreSession', () => {
    it('should return true and set token when refresh succeeds', () => {
      let result: boolean | undefined;
      service.tryRestoreSession().subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAccessTokenResponse);

      expect(result).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isSessionRestored()).toBe(true);
    });

    it('should return false and mark session restored when refresh fails', () => {
      let result: boolean | undefined;
      service.tryRestoreSession().subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isSessionRestored()).toBe(true);
    });

    it('should not throw on network error', () => {
      let result: boolean | undefined;
      service.tryRestoreSession().subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      req.error(new ProgressEvent('error'));

      expect(result).toBe(false);
      expect(service.isSessionRestored()).toBe(true);
    });
  });

  describe('isSessionRestored', () => {
    it('should return false initially', () => {
      expect(service.isSessionRestored()).toBe(false);
    });

    it('should return true after tryRestoreSession completes successfully', () => {
      service.tryRestoreSession().subscribe();
      httpMock.expectOne(`${authUrl}/refresh`).flush(mockAccessTokenResponse);
      expect(service.isSessionRestored()).toBe(true);
    });

    it('should return true after tryRestoreSession fails', () => {
      service.tryRestoreSession().subscribe();
      httpMock.expectOne(`${authUrl}/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(service.isSessionRestored()).toBe(true);
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return the access token after login', () => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      expect(service.getAccessToken()).toBe(mockAccessTokenResponse.accessToken);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not authenticated', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return the user after login', () => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
      expect(user!.profile).toBe('Administrator');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid and not expired', () => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const expiredPayload = { ...mockPayload, exp: Math.floor(Date.now() / 1000) - 60 };
      const expiredResponse: AccessTokenResponse = {
        accessToken: createFakeJwt(expiredPayload),
      };

      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(expiredResponse);

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('hasAction', () => {
    beforeEach(() => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockAccessTokenResponse);
    });

    it('should return true for an action the user has', () => {
      expect(service.hasAction('USER_READ')).toBe(true);
      expect(service.hasAction('USER_WRITE')).toBe(true);
      expect(service.hasAction('DASHBOARD_READ')).toBe(true);
    });

    it('should return false for an action the user does not have', () => {
      expect(service.hasAction('PROFILE_WRITE')).toBe(false);
      expect(service.hasAction('CLUSTER_NODE_READ')).toBe(false);
    });

    it('should return false when not authenticated', () => {
      service.logout().subscribe();
      httpMock.expectOne(`${authUrl}/logout`).flush(null);

      expect(service.hasAction('USER_READ')).toBe(false);
    });
  });

  describe('JWT decoding', () => {
    it('should handle tokens with base64url characters', () => {
      const payloadWithSpecialChars = {
        sub: 'user+special/chars',
        profile: 'Test Profile',
        actions: ['ACTION_READ'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createFakeJwt(payloadWithSpecialChars);

      service.login({ username: 'user', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({ accessToken: token });

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('user+special/chars');
    });

    it('should return null user for an invalid token format', () => {
      service.login({ username: 'user', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({ accessToken: 'not-a-valid-jwt' });

      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle tokens with missing actions field gracefully', () => {
      const payloadNoActions = {
        sub: 'admin',
        profile: 'Admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createFakeJwt(payloadNoActions);

      service.login({ username: 'admin', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({ accessToken: token });

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.actions).toEqual([]);
    });
  });
});
