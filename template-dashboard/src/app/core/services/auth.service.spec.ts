import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { LoginRequest, TokenResponse } from '../models/auth.model';
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

  const mockTokenResponse: TokenResponse = {
    accessToken: createFakeJwt(mockPayload),
    refreshToken: 'mock-refresh-token',
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
    it('should call POST /auth/login and store tokens', () => {
      const credentials: LoginRequest = { username: 'admin', password: 'secret' };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockTokenResponse);
      });

      const req = httpMock.expectOne(`${authUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockTokenResponse);

      expect(service.getAccessToken()).toBe(mockTokenResponse.accessToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should decode the JWT payload and set the current user', () => {
      const credentials: LoginRequest = { username: 'admin', password: 'secret' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${authUrl}/login`);
      req.flush(mockTokenResponse);

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
      expect(user!.profile).toBe('Administrator');
      expect(user!.actions).toEqual(['USER_READ', 'USER_WRITE', 'DASHBOARD_READ']);
    });
  });

  describe('logout', () => {
    it('should call POST /auth/logout and clear tokens', () => {
      // First login
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);

      // Then logout
      service.logout().subscribe();
      const req = httpMock.expectOne(`${authUrl}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      req.flush(null);

      expect(service.getAccessToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should call POST /auth/refresh and update tokens', () => {
      // First login
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);

      const newPayload = { ...mockPayload, exp: mockPayload.exp + 3600 };
      const newTokenResponse: TokenResponse = {
        accessToken: createFakeJwt(newPayload),
        refreshToken: 'new-refresh-token',
      };

      service.refreshToken().subscribe((response) => {
        expect(response).toEqual(newTokenResponse);
      });

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      req.flush(newTokenResponse);

      expect(service.getAccessToken()).toBe(newTokenResponse.accessToken);
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return the access token after login', () => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);

      expect(service.getAccessToken()).toBe(mockTokenResponse.accessToken);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not authenticated', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return the user after login', () => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);

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
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const expiredPayload = { ...mockPayload, exp: Math.floor(Date.now() / 1000) - 60 };
      const expiredTokenResponse: TokenResponse = {
        accessToken: createFakeJwt(expiredPayload),
        refreshToken: 'mock-refresh-token',
      };

      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(expiredTokenResponse);

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('hasAction', () => {
    beforeEach(() => {
      service.login({ username: 'admin', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockTokenResponse);
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
      httpMock.expectOne(`${authUrl}/login`).flush({
        accessToken: token,
        refreshToken: 'ref',
      });

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('user+special/chars');
    });

    it('should return null user for an invalid token format', () => {
      service.login({ username: 'user', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({
        accessToken: 'not-a-valid-jwt',
        refreshToken: 'ref',
      });

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
      httpMock.expectOne(`${authUrl}/login`).flush({
        accessToken: token,
        refreshToken: 'ref',
      });

      const user = service.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.actions).toEqual([]);
    });
  });
});
