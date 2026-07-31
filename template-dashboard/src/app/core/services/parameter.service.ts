import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page, Parameter, ParameterCriteria } from '../models/parameter.model';

/**
 * Service for managing system parameters via the backend API.
 * Handles CRUD operations with server-side pagination and filtering.
 */
@Injectable({ providedIn: 'root' })
export class ParameterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/parameters`;

  /**
   * Retrieves a paginated list of parameters with optional filters.
   */
  findByCriteria(criteria: ParameterCriteria, page: number, size: number): Observable<Page<Parameter>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (criteria.code) {
      params = params.set('code', criteria.code);
    }
    if (criteria.description) {
      params = params.set('description', criteria.description);
    }
    if (criteria.type) {
      params = params.set('type', criteria.type);
    }

    return this.http.get<Page<Parameter>>(this.baseUrl, { params });
  }

  /**
   * Counts the total number of parameters matching the given criteria.
   */
  countByCriteria(criteria: ParameterCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.code) {
      params = params.set('code', criteria.code);
    }
    if (criteria.description) {
      params = params.set('description', criteria.description);
    }
    if (criteria.type) {
      params = params.set('type', criteria.type);
    }

    return this.http.get<number>(`${this.baseUrl}/count`, { params });
  }

  /**
   * Retrieves a single parameter by its unique code.
   */
  findByCode(code: string): Observable<Parameter> {
    return this.http.get<Parameter>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }

  /**
   * Creates a new parameter.
   */
  create(parameter: Parameter): Observable<Parameter> {
    return this.http.post<Parameter>(this.baseUrl, parameter);
  }

  /**
   * Updates an existing parameter identified by code.
   */
  update(code: string, parameter: Parameter): Observable<Parameter> {
    return this.http.put<Parameter>(`${this.baseUrl}/${encodeURIComponent(code)}`, parameter);
  }

  /**
   * Deletes a parameter by its code.
   */
  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }
}
