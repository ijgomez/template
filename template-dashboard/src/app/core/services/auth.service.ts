import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccessTokenResponse, LoginRequest, User } from '../models/auth.model';

/**
 * Service responsible for authentication and token management.
 *
 * Security model:
 * - Access token: stored in memory only (private field) — never in localStorage/sessionStorage.
 * - Refresh token: managed entirely by the browser as an HttpOnly cookie — never accessible to JS.
 *
 * Session recovery:
 * On application startup, `tryRestoreSession()` attempts a silent refresh via the cookie.
 * If the cookie is valid, a new access token is obtained without user interaction.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = null;
  private currentUser: User | null = null;
  private sessionRestored = false;

  /**
   * Authenticates the user with credentials.
   * The access token is stored in memory; the refresh token is set as a cookie by the server.
   */
  login(credentials: LoginRequest): Observable<AccessTokenResponse> {
    return this.http
      .post<AccessTokenResponse>(`${this.authUrl}/login`, credentials, { withCredentials: true })
      .pipe(tap((response) => this.storeAccessToken(response.accessToken)));
  }

  /**
   * Logs out the user by invalidating the refresh token on the server
   * (which also clears the cookie) and clearing local token state.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout`, null, { withCredentials: true }).pipe(
      tap(() => this.clearTokens()),
      catchError(() => {
        this.clearTokens();
        return of(undefined);
      }),
    );
  }

  /**
   * Refreshes the access token using the HttpOnly cookie (sent automatically by the browser).
   * No request body is needed — the server reads the refresh token from the cookie.
   */
  refreshToken(): Observable<AccessTokenResponse> {
    return this.http
      .post<AccessTokenResponse>(`${this.authUrl}/refresh`, null, { withCredentials: true })
      .pipe(tap((response) => this.storeAccessToken(response.accessToken)));
  }

  /**
   * Attempts to restore a session on application startup.
   * Calls the refresh endpoint; if the cookie exists and is valid, obtains a new access token.
   * Returns true if the session was recovered, false otherwise.
   */
  tryRestoreSession(): Observable<boolean> {
    return this.http
      .post<AccessTokenResponse>(`${this.authUrl}/refresh`, null, { withCredentials: true })
      .pipe(
        tap((response) => this.storeAccessToken(response.accessToken)),
        map(() => {
          this.sessionRestored = true;
          return true;
        }),
        catchError(() => {
          this.sessionRestored = true;
          return of(false);
        }),
      );
  }

  /**
   * Returns whether the session restore attempt has completed.
   * Used by guards to avoid premature redirect to login.
   */
  isSessionRestored(): boolean {
    return this.sessionRestored;
  }

  /**
   * Returns the current access token or null if not authenticated.
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Returns the current user decoded from the JWT or null if not authenticated.
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Checks whether the user is authenticated with a non-expired token.
   */
  isAuthenticated(): boolean {
    if (!this.accessToken || !this.currentUser) {
      return false;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return this.currentUser.exp > nowInSeconds;
  }

  /**
   * Checks if the current user has a specific action code.
   */
  hasAction(actionCode: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    return this.currentUser.actions.includes(actionCode);
  }

  /**
   * Stores access token in memory and decodes the JWT payload.
   */
  private storeAccessToken(token: string): void {
    this.accessToken = token;
    this.currentUser = this.decodeJwtPayload(token);
  }

  /**
   * Clears all token state from memory.
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.currentUser = null;
  }

  /**
   * Decodes a JWT token payload without verifying the signature.
   * Uses base64url decoding to extract the payload segment.
   */
  private decodeJwtPayload(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      const parsed = JSON.parse(decoded);
      return {
        username: parsed.sub,
        profile: parsed.profile,
        actions: parsed.actions ?? [],
        exp: parsed.exp,
        iat: parsed.iat,
      };
    } catch {
      return null;
    }
  }

  /**
   * Decodes a base64url-encoded string to a UTF-8 string.
   */
  private base64UrlDecode(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    return atob(base64);
  }
}
