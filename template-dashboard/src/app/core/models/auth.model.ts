/**
 * Request payload for user authentication.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response payload from the login endpoint.
 * Only contains the access token — the refresh token is delivered via HttpOnly cookie.
 */
export interface AccessTokenResponse {
  accessToken: string;
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
