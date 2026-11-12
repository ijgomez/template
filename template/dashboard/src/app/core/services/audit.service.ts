import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuditLog, AuditCriteria } from '../models/audit.model';
import { Page } from '../models/page.model';
import { DateService } from './date.service';

/** Page size used to fetch the full filtered list for exports (bypasses UI pagination). */
const EXPORT_PAGE_SIZE = 100000;

/**
 * Service for querying audit log entries via the backend API.
 * Audit logs are read-only (no create/update/delete operations).
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly dateService = inject(DateService);
  private readonly baseUrl = `${environment.apiUrl}/administration/audit`;

  /**
   * Retrieves a paginated list of audit log entries with optional filters.
   */
  findByCriteria(criteria: AuditCriteria, page: number, size: number, sort?: string): Observable<Page<AuditLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    params = this.appendDateRange(params, criteria);
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
   * Retrieves the full list of audit log entries matching the given filters, ignoring UI pagination.
   * Used for exports so the exported file reflects all filtered rows, not just the current page.
   */
  findAllByCriteria(criteria: AuditCriteria, sort?: string): Observable<AuditLog[]> {
    return this.findByCriteria(criteria, 0, EXPORT_PAGE_SIZE, sort).pipe(map((page) => page.content));
  }

  /**
   * Returns the total count of audit log entries matching the given criteria.
   */
  countByCriteria(criteria: AuditCriteria): Observable<number> {
    let params = new HttpParams();

    params = this.appendDateRange(params, criteria);
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

  /**
   * Adds the date-range filter as UTC instants: the local days chosen by the user (browser time
   * zone, 'YYYY-MM-DD') become the half-open range [fromDate, toDate) expected by the backend.
   */
  private appendDateRange(params: HttpParams, criteria: Pick<AuditCriteria, 'dateFrom' | 'dateTo'>): HttpParams {
    let result = params;
    if (criteria.dateFrom) {
      result = result.set('fromDate', this.dateService.toUtcStartOfLocalDay(criteria.dateFrom));
    }
    if (criteria.dateTo) {
      result = result.set('toDate', this.dateService.toUtcStartOfNextLocalDay(criteria.dateTo));
    }
    return result;
  }
}
