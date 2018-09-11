import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';
import { Report } from '../../domain/reports/report';
import { ReportCriteria } from '../../domain/reports/report-criteria';
import { DropdownQuestion } from '../../views/components/forms/questions/question-dropdown';
import { TextboxQuestion } from '../../views/components/forms/questions/question-textbox';
import { DataTablesResponse } from '../../domain/datatables/data-tables-response';

@Injectable()
export class ReportsService extends TemplateService {
  

  private url = environment.urlBase + '/reports';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) {
    super();
   }

  findByCriteria(criteria: ReportCriteria): Observable<Report[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  countByCriteria(criteria: ReportCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  table(dataTablesParameters: any): Observable<DataTablesResponse> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/datatables', dataTablesParameters, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  create(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, report, options).pipe(
      map(success => success.status),
      catchError(this.handleError)
    );
  }

  read(id: number | string): Observable<Report> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  update(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${report.id}`, report, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  delete(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${report.id}`, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  export(criteria: ReportCriteria): Observable<Response> {
    const options = new RequestOptions({});

    return this.http.get(this.url + '/export', options).pipe(
      map((response: Response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  readReportParams(id: number | string): any {
    const questions = [
      new DropdownQuestion({
        key: 'reportParam3',
        label: 'Parameter 3',
        options: [
          {key: 'option1', value: 'Option 1'},
          {key: 'option2', value: 'Option 2'},
          {key: 'option3', value: 'Option 3'},
          {key: 'option4', value: 'Option 4'}
        ],
        order: 3
      }),

      new TextboxQuestion({
        key: 'reportParam1',
        label: 'Parameter 1',
        value: 'Default Value',
        required: true,
        order: 1
      }),

      new TextboxQuestion({
        key: 'reportParam2',
        label: 'Parameter 2 (e-Mail)',
        type: 'email',
        order: 2
      })
    ];

    return questions;
  }

}
