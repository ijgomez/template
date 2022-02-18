import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { ReportCriteria } from '../../models/reports/report-criteria.model';
import { Report } from '../../models/reports/report.model';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { QuestionFactory } from 'src/app/shared/components/forms/questions/question-factory';
import { ReportParam } from '../../models/reports/report-param.model';
import { ReportEngine } from '../../models/reports/report-engine.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService extends TemplateService<Report, ReportCriteria> {
  
  constructor(public http: HttpClient, private questionFactory: QuestionFactory) { super(http, '/api/reports'); }

  params(id: number | string): Observable<any> {

    return this.http.get<ReportParam[]>(`${this.url}/${id}/params`, this.options).pipe(
      map((response: ReportParam[]) => {
        return this.questionFactory.build(response);
      }),
      catchError(this.handleError<any>('params'))
    );
  }

  engines(): Observable<ReportEngine[]> {
    return this.http.get<ReportEngine[]>(`${this.url}/engines`, this.options).pipe(
      map((response: ReportEngine[]) => {
        return response;
      }),
      catchError(this.handleError<ReportEngine[]>('engines'))
    );
  }

  execute(id: number | string, params: any): Observable<any> {
    return this.http.post(`${this.url}/${id}/execute`, params, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      catchError(this.handleError<any>('execute'))
    );
  }
}
