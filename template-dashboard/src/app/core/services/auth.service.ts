import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse, User } from '../models/auth.model';

/**
 * Service responsible for authentication and token management.
 * Tokens are stored in memory (private fields) for security — not localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private currentUser: User | null = null;

  /**
   * Authenticates the user with credentials.
   * Stores tokens in memory and decodes the JWT payload.
   */
  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  /**
   * Logs out the user by invalidating the refresh token on the server
   * and clearing local token state.
   */
  logout(): Observable<void> {
    const body = { refreshToken: this.refreshTokenValue };
    return this.http.post<void>(`${this.authUrl}/logout`, body).pipe(
      tap(() => this.clearTokens()),
    );
  }

  /**
   * Refreshes the access token using the stored refresh token.
   */
  refreshToken(): Observable<TokenResponse> {
    const body = { refreshToken: this.refreshTokenValue };
    return this.http.post<TokenResponse>(`${this.authUrl}/refresh`, body).pipe(
      tap((response) => this.storeTokens(response)),
    );
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
   * Stores tokens in memory and decodes the access token payload.
   */
  private storeTokens(response: TokenResponse): void {
    this.accessToken = response.accessToken;
    this.refreshTokenValue = response.refreshToken;
    this.currentUser = this.decodeJwtPayload(response.accessToken);
  }

  /**
   * Clears all token state from memory.
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshTokenValue = null;
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
