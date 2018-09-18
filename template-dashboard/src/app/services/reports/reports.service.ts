import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod, ResponseContentType } from '@angular/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';
import { Report } from '../../domain/reports/report';
import { ReportCriteria } from '../../domain/reports/report-criteria';
import { DropdownQuestion } from '../../views/components/forms/questions/question-dropdown';
import { TextboxQuestion } from '../../views/components/forms/questions/question-textbox';
import { DataTablesResponse } from '../../domain/datatables/data-tables-response';
import { ReportParam } from '../../domain/reports/report-param';
import { QuestionFactory } from '../../views/components/forms/questions/question-factory';

@Injectable()
export class ReportsService extends TemplateService {
  

  private url = environment.urlBase + '/reports';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http, private questionFactory: QuestionFactory) {
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

  export(criteria: ReportCriteria, filename: String): Observable<any> {
    const options = new RequestOptions({
      responseType: ResponseContentType.Blob
    });

    return this.http.get(this.url + '/export', options).pipe(
      map((response: Response) => {
        return {
          filename: filename,
          data: response.blob()
        };
      }),
      catchError(this.handleError)
    );
  }

  readReportParams(id: number | string): Observable<any> {
    
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}/params`, options).pipe(
      map((response: Response) => {
        return this.questionFactory.build(response.json());
      }),
      catchError(this.handleError)
    );
  }

  execute(id: number | string, params: any): Observable<any> {
    
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(`${this.url}/${id}/execute`, params, options).pipe(
      map((response: Response) => {
        return {
          filename: 'report',
          data: response.blob()
        };
      }),
      catchError(this.handleError)
    );
  }

}



