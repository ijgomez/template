import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Action, ActionCriteria } from '../../features/administration/security/actions/models/action.model';
import { Page } from '../models/page.model';

/**
 * Service for managing system actions (permissions).
 * Actions support read and update operations only (no create/delete).
 */
@Injectable({ providedIn: 'root' })
export class ActionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/security/actions`;

  /**
   * Retrieves a paginated list of actions with optional filters.
   */
  findByCriteria(criteria: ActionCriteria, page: number, size: number, sort?: string): Observable<Page<Action>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    if (criteria.code) {
      params = params.set('code', criteria.code);
    }
    if (criteria.name) {
      params = params.set('name', criteria.name);
    }
    if (criteria.type) {
      params = params.set('type', criteria.type);
    }

    return this.http.get<Page<Action>>(this.baseUrl, { params });
  }

  /**
   * Retrieves the total count of actions matching the given criteria.
   */
  countByCriteria(criteria: ActionCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.code) {
      params = params.set('code', criteria.code);
    }
    if (criteria.name) {
      params = params.set('name', criteria.name);
    }
    if (criteria.type) {
      params = params.set('type', criteria.type);
    }

    return this.http.get<number>(`${this.baseUrl}/count`, { params });
  }

  /**
   * Retrieves a single action by ID.
   */
  findById(id: number): Observable<Action> {
    return this.http.get<Action>(`${this.baseUrl}/${id}`);
  }

  /**
   * Updates an existing action (name, description, type only).
   */
  update(id: number, action: Partial<Action>): Observable<Action> {
    return this.http.put<Action>(`${this.baseUrl}/${id}`, action);
  }
}
