import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { UpdateProfileRequest, UserProfile } from '../models/profile.model';

/**
 * Service for managing the authenticated user's profile.
 * Calls the /users/me endpoints for self-service profile operations.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/security/users/me`;

  /**
   * Retrieves the current user's profile.
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl);
  }

  /**
   * Updates the current user's profile (nombre, apellidos, email).
   */
  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.baseUrl, data);
  }
}
