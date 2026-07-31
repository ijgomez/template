import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditLog, AuditCriteria, Page } from '../models/audit.model';

/**
 * Service for querying audit log entries via the backend API.
 * Audit logs are read-only (no create/update/delete operations).
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/administration/audit`;

  /**
   * Retrieves a paginated list of audit log entries with optional filters.
   */
  findByCriteria(criteria: AuditCriteria, page: number, size: number): Observable<Page<AuditLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (criteria.dateFrom) {
      params = params.set('dateFrom', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      params = params.set('dateTo', criteria.dateTo);
    }
    if (criteria.username) {
      params = params.set('username', criteria.username);
    }
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.section) {
      params = params.set('section', criteria.section);
    }

    return this.http.get<Page<AuditLog>>(this.baseUrl, { params });
  }

  /**
   * Returns the total count of audit log entries matching the given criteria.
   */
  countByCriteria(criteria: AuditCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.dateFrom) {
      params = params.set('dateFrom', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      params = params.set('dateTo', criteria.dateTo);
    }
    if (criteria.username) {
      params = params.set('username', criteria.username);
    }
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.section) {
      params = params.set('section', criteria.section);
    }

    return this.http.get<number>(`${this.baseUrl}/count`, { params });
  }
}
