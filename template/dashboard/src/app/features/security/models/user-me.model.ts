/**
 * User profile data returned from GET /api/v1/administration/security/users/me.
 */
export interface UserProfile {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  lastAccess: string | null;
}

/**
 * Payload for updating user profile via PUT /api/v1/administration/security/users/me.
 * Only editable fields: nombre, apellidos, email.
 */
export interface UpdateProfileRequest {
  nombre: string;
  apellidos: string;
  email: string;
}
