import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Report, ReportFilter, ReportResult, ExportFormat } from '../models/report.model';

/**
 * Service for report operations: list user reports, get filters, execute, and export.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  /**
   * Retrieves the list of reports assigned to the current user.
   */
  findUserReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.baseUrl);
  }

  /**
   * Retrieves the filter definitions for a specific report.
   */
  getFilters(reportId: number): Observable<ReportFilter[]> {
    return this.http.get<ReportFilter[]>(`${this.baseUrl}/${reportId}/filters`);
  }

  /**
   * Executes a report with the given filters and pagination.
   */
  execute(reportId: number, filters: Record<string, string>, page: number, size: number): Observable<ReportResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.post<ReportResult>(`${this.baseUrl}/${reportId}/execute`, filters, { params });
  }

  /**
   * Exports a report in the specified format. Returns the file as a Blob.
   */
  export(reportId: number, filters: Record<string, string>, format: ExportFormat): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/${reportId}/export/${format}`, filters, {
      responseType: 'blob',
    });
  }
}
