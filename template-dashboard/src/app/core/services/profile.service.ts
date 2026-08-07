import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Action, Page, Profile, ProfileCriteria } from '../../features/administration/security/profiles/models/profile.model';

/**
 * Service for managing security profiles via the backend API.
 * Handles CRUD operations, pagination, filtering, and action loading.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/security/profiles`;
  private readonly actionsUrl = `${environment.apiUrl}/administration/security/actions`;

  /**
   * Retrieves a paginated list of profiles with optional filtering.
   */
  findByCriteria(criteria: ProfileCriteria, page: number, size: number, sort?: string): Observable<Page<Profile>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    if (criteria.name) {
      params = params.set('name', criteria.name);
    }

    return this.http.get<Page<Profile>>(this.baseUrl, { params });
  }

  /**
   * Returns the total count of profiles matching the given criteria.
   */
  countByCriteria(criteria: ProfileCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.name) {
      params = params.set('name', criteria.name);
    }

    return this.http.get<number>(`${this.baseUrl}/count`, { params });
  }

  /**
   * Retrieves a single profile by its ID.
   */
  findById(id: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a new profile.
   */
  create(profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.baseUrl, profile);
  }

  /**
   * Updates an existing profile.
   */
  update(id: number, profile: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${id}`, profile);
  }

  /**
   * Deletes a profile by its ID.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Retrieves all available actions for the multi-select assignment.
   */
  findAllActions(): Observable<Page<Action>> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '1000');

    return this.http.get<Page<Action>>(this.actionsUrl, { params });
  }
}
