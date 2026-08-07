import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InterfaceConfig, InterfaceLog, InterfaceLogCriteria } from '../models/interface.model';
import { Page } from '../models/page.model';

/**
 * Service for querying interface configurations and operation logs.
 * Read-only — interfaces are managed externally.
 */
@Injectable({ providedIn: 'root' })
export class InterfaceService {
  private readonly http = inject(HttpClient);
  private readonly configUrl = `${environment.apiUrl}/interfaces/configuration`;
  private readonly monitorUrl = `${environment.apiUrl}/interfaces/monitor`;

  /**
   * Retrieves all interface configurations with their current status.
   */
  findAllConfigurations(): Observable<InterfaceConfig[]> {
    return this.http.get<InterfaceConfig[]>(this.configUrl);
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

    if (criteria.dateFrom) {
      params = params.set('dateFrom', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      params = params.set('dateTo', criteria.dateTo);
    }
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.interfaceId) {
      params = params.set('interfaceId', criteria.interfaceId.toString());
    }
    if (criteria.status) {
      params = params.set('status', criteria.status);
    }

    return this.http.get<Page<InterfaceLog>>(this.monitorUrl, { params });
  }

  /**
   * Returns the total count of interface logs matching the given criteria.
   */
  countLogsByCriteria(criteria: InterfaceLogCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.dateFrom) {
      params = params.set('dateFrom', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      params = params.set('dateTo', criteria.dateTo);
    }
    if (criteria.operationType) {
      params = params.set('operationType', criteria.operationType);
    }
    if (criteria.interfaceId) {
      params = params.set('interfaceId', criteria.interfaceId.toString());
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
}
