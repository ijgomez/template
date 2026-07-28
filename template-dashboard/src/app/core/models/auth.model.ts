/**
 * Request payload for user authentication.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response payload from authentication endpoints (login/refresh).
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Represents the authenticated user extracted from the JWT payload.
 */
export interface User {
  username: string;
  profile: string;
  actions: string[];
  exp: number;
  iat: number;
}
