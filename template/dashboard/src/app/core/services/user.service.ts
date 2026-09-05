import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { UserDTO, UserCriteria, ProfileRef, ReportRef } from '../models/user.model';
import { Page } from '../models/page.model';

/** Page size used to fetch the full filtered list for exports (bypasses UI pagination). */
const EXPORT_PAGE_SIZE = 100000;

/**
 * Service for managing user CRUD operations via the backend API.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/security/users`;
  private readonly profilesUrl = `${environment.apiUrl}/administration/security/profiles`;
  private readonly reportsUrl = `${environment.apiUrl}/reports`;

  /**
   * Fetches a paginated list of users with optional filters.
   */
  findByCriteria(criteria: UserCriteria, page: number, size: number, sort?: string): Observable<Page<UserDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    if (criteria.username) {
      params = params.set('username', criteria.username);
    }
    if (criteria.firstName) {
      params = params.set('firstName', criteria.firstName);
    }
    if (criteria.lastName) {
      params = params.set('lastName', criteria.lastName);
    }
    if (criteria.email) {
      params = params.set('email', criteria.email);
    }
    if (criteria.profileId) {
      params = params.set('profileId', criteria.profileId.toString());
    }

    return this.http.get<Page<UserDTO>>(this.baseUrl, { params });
  }

  /**
   * Fetches the full list of users matching the given filters, ignoring UI pagination.
   * Used for exports so the exported file reflects all filtered rows, not just the current page.
   */
  findAllByCriteria(criteria: UserCriteria, sort?: string): Observable<UserDTO[]> {
    return this.findByCriteria(criteria, 0, EXPORT_PAGE_SIZE, sort).pipe(map((page) => page.content));
  }

  /**
   * Counts users matching the given criteria.
   */
  countByCriteria(criteria: UserCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.username) {
      params = params.set('username', criteria.username);
    }
    if (criteria.firstName) {
      params = params.set('firstName', criteria.firstName);
    }
    if (criteria.lastName) {
      params = params.set('lastName', criteria.lastName);
    }
    if (criteria.email) {
      params = params.set('email', criteria.email);
    }
    if (criteria.profileId) {
      params = params.set('profileId', criteria.profileId.toString());
    }

    return this.http.get<number>(`${this.baseUrl}/count`, { params });
  }

  /**
   * Fetches a single user by ID.
   */
  findById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a new user.
   */
  create(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.baseUrl, user);
  }

  /**
   * Updates an existing user.
   */
  update(id: number, user: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.baseUrl}/${id}`, user);
  }

  /**
   * Deletes a user by ID.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Fetches all profiles for the profile selector.
   */
  getProfiles(): Observable<ProfileRef[]> {
    return this.http.get<ProfileRef[]>(`${this.profilesUrl}/references`);
  }

  /**
   * Fetches all reports for the report multi-select.
   */
  getReports(): Observable<ReportRef[]> {
    return this.http.get<ReportRef[]>(`${this.reportsUrl}/all`);
  }
}
