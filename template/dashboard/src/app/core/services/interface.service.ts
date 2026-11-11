import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { InterfaceConfig, InterfaceConfigCriteria, InterfaceLog, InterfaceLogCriteria } from '../models/interface.model';
import { Page } from '../models/page.model';
import { DateService } from './date.service';

/** Page size used to fetch the full filtered list for exports (bypasses UI pagination). */
const EXPORT_PAGE_SIZE = 100000;

/**
 * Service for querying interface configurations and operation logs.
 * Read-only — interfaces are managed externally.
 */
@Injectable({ providedIn: 'root' })
export class InterfaceService {
  private readonly http = inject(HttpClient);
  private readonly dateService = inject(DateService);
  private readonly configUrl = `${environment.apiUrl}/interfaces/configuration`;
  private readonly monitorUrl = `${environment.apiUrl}/interfaces/monitor`;

  /**
   * Retrieves all interface configurations with their current status.
   */
  findAllConfigurations(): Observable<InterfaceConfig[]> {
    return this.http.get<InterfaceConfig[]>(this.configUrl);
  }

  /**
   * Retrieves a paginated list of interface configurations with optional filters.
   */
  findConfigurationsByCriteria(
    criteria: InterfaceConfigCriteria,
    page: number,
    size: number,
    sort?: string,
  ): Observable<Page<InterfaceConfig>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }
    if (criteria.name) {
      params = params.set('name', criteria.name);
    }
    if (criteria.protocol) {
      params = params.set('protocol', criteria.protocol);
    }
    if (criteria.status) {
      params = params.set('status', criteria.status);
    }

    return this.http.get<Page<InterfaceConfig>>(`${this.configUrl}/search`, { params });
  }

  /**
   * Retrieves a single interface configuration by ID.
   */
  findConfigurationById(id: number): Observable<InterfaceConfig> {
    return this.http.get<InterfaceConfig>(`${this.configUrl}/${id}`);
  }

  /**
   * Retrieves a paginated list of interface operation logs with optional filters.
   */
  findLogsByCriteria(criteria: InterfaceLogCriteria, page: number, size: number, sort?: string): Observable<Page<InterfaceLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    params = this.appendDateRange(params, criteria);
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.interfaceName) {
      params = params.set('interfaceName', criteria.interfaceName);
    }
    if (criteria.status) {
      params = params.set('status', criteria.status);
    }

    return this.http.get<Page<InterfaceLog>>(this.monitorUrl, { params });
  }

  /**
   * Retrieves the full list of interface logs matching the given filters, ignoring UI pagination.
   * Used for exports so the exported file reflects all filtered rows, not just the current page.
   */
  findAllLogsByCriteria(criteria: InterfaceLogCriteria, sort?: string): Observable<InterfaceLog[]> {
    return this.findLogsByCriteria(criteria, 0, EXPORT_PAGE_SIZE, sort).pipe(map((page) => page.content));
  }

  /**
   * Returns the total count of interface logs matching the given criteria.
   */
  countLogsByCriteria(criteria: InterfaceLogCriteria): Observable<number> {
    let params = new HttpParams();

    params = this.appendDateRange(params, criteria);
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.interfaceName) {
      params = params.set('interfaceName', criteria.interfaceName);
    }
    if (criteria.status) {
      params = params.set('status', criteria.status);
    }

    return this.http.get<number>(`${this.monitorUrl}/count`, { params });
  }

  /**
   * Retrieves a single interface log entry by ID.
   */
  findLogById(id: number): Observable<InterfaceLog> {
    return this.http.get<InterfaceLog>(`${this.monitorUrl}/${id}`);
  }

  /**
   * Adds the date-range filter as UTC instants: the local days chosen by the user (browser time
   * zone, 'YYYY-MM-DD') become the half-open range [fromDate, toDate) expected by the backend.
   */
  private appendDateRange(params: HttpParams, criteria: Pick<InterfaceLogCriteria, 'dateFrom' | 'dateTo'>): HttpParams {
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
