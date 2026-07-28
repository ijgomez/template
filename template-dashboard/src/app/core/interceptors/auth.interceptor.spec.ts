import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { EMPTY, of, Subject, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenResponse, User } from '../models/auth.model';
import { authInterceptor, resetRefreshState } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    getAccessToken: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasAction: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const apiUrl = environment.apiUrl;

  /** Creates a mock User with configurable expiry offset from now. */
  function createUser(expOffsetSeconds: number): User {
    return {
      username: 'admin',
      profile: 'Administrator',
      actions: ['USER_READ', 'DASHBOARD_READ'],
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
      iat: Math.floor(Date.now() / 1000),
    };
  }

  beforeEach(() => {
    resetRefreshState();

    authServiceMock = {
      getAccessToken: vi.fn(),
      getCurrentUser: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      login: vi.fn(),
      isAuthenticated: vi.fn(),
      hasAction: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authorization header attachment', () => {
    it('should add Authorization Bearer header when token exists', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush([]);
    });

    it('should NOT add Authorization header when no token exists', () => {
      authServiceMock.getAccessToken.mockReturnValue(null);

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  describe('Auth endpoint skipping', () => {
    it('should NOT add Authorization header to /auth/login', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      httpClient.post(`${apiUrl}/auth/login`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add Authorization header to /auth/refresh', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      httpClient.post(`${apiUrl}/auth/refresh`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add Authorization header to /auth/logout', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      httpClient.post(`${apiUrl}/auth/logout`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Token expiry detection and auto-refresh', () => {
    it('should proactively refresh token when near expiry', () => {
      // Token expires in 30 seconds (less than 60s margin)
      authServiceMock.getAccessToken.mockReturnValue('expiring-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(30));

      const newTokenResponse: TokenResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      };
      authServiceMock.refreshToken.mockReturnValue(of(newTokenResponse));

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer new-token');
      req.flush([]);
    });

    it('should NOT refresh token when far from expiry', () => {
      // Token expires in 2 hours (more than 60s margin)
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(7200));

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
      req.flush([]);
    });
  });

  describe('401 response handling', () => {
    it('should attempt token refresh on 401 and retry original request', () => {
      authServiceMock.getAccessToken.mockReturnValue('expired-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      const newTokenResponse: TokenResponse = {
        accessToken: 'refreshed-token',
        refreshToken: 'new-refresh',
      };
      authServiceMock.refreshToken.mockReturnValue(of(newTokenResponse));

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      // First request fails with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Retried request with new token
      const retryReq = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
      retryReq.flush([]);
    });

    it('should redirect to login when refresh fails on 401', () => {
      authServiceMock.getAccessToken.mockReturnValue('expired-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      authServiceMock.refreshToken.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      );
      authServiceMock.logout.mockReturnValue(EMPTY);

      httpClient.get(`${apiUrl}/administration/security/users`).subscribe({
        error: () => {
          // Expected to error
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe('Error handling pipeline', () => {
    it('should propagate 403 with forbidden error key', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      let receivedError: any;
      httpClient.get(`${apiUrl}/administration/security/users`).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      req.flush({ message: 'Forbidden resource' }, { status: 403, statusText: 'Forbidden' });

      expect(receivedError.status).toBe(403);
      expect(receivedError.messageKey).toBe('error.forbidden');
      expect(receivedError.message).toBe('Forbidden resource');
    });

    it('should propagate 4xx with server message', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      let receivedError: any;
      httpClient.get(`${apiUrl}/administration/security/users/999`).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

      expect(receivedError.status).toBe(404);
      expect(receivedError.messageKey).toBe('error.client');
      expect(receivedError.message).toBe('User not found');
    });

    it('should propagate 5xx with generic server error key', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      let receivedError: any;
      httpClient.get(`${apiUrl}/administration/security/users`).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(receivedError.status).toBe(500);
      expect(receivedError.messageKey).toBe('error.server');
    });

    it('should handle network errors with offline indicator', () => {
      authServiceMock.getAccessToken.mockReturnValue('valid-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(3600));

      let receivedError: any;
      httpClient.get(`${apiUrl}/administration/security/users`).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${apiUrl}/administration/security/users`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError.status).toBe(0);
      expect(receivedError.messageKey).toBe('error.network');
      expect(receivedError.offline).toBe(true);
    });
  });

  describe('Concurrent request handling during refresh', () => {
    it('should queue requests while refresh is in progress', () => {
      // Token expires in 30 seconds (near expiry)
      authServiceMock.getAccessToken.mockReturnValue('expiring-token');
      authServiceMock.getCurrentUser.mockReturnValue(createUser(30));

      const refreshSubject = new Subject<TokenResponse>();
      authServiceMock.refreshToken.mockReturnValue(refreshSubject.asObservable());

      // First request triggers refresh
      httpClient.get(`${apiUrl}/administration/security/users`).subscribe();

      // Second request should be queued
      httpClient.get(`${apiUrl}/administration/security/profiles`).subscribe();

      // Complete the refresh
      refreshSubject.next({ accessToken: 'new-token', refreshToken: 'new-refresh' });
      refreshSubject.complete();

      // Both requests should now be sent with new token
      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(2);
      requests.forEach((req) => {
        expect(req.request.headers.get('Authorization')).toBe('Bearer new-token');
        req.flush([]);
      });
    });
  });
});
