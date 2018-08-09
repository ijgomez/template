import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { ReportCriteria } from '../../domain/reports/report-criteria';
import { Report } from '../../domain/reports/report';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class ReportsService {

  private url = environment.urlBase + '/reports';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) { }

  findByCriteria(criteria: ReportCriteria): Observable<Report[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  countByCriteria(criteria: ReportCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  create(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, report, options)
      .map(success => success.status)
      .catch(this.handleError);
  }

  read(id: number | string): Observable<Report> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  update(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${report.id}`, report, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  delete(report: Report): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${report.id}`, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  export(criteria: ReportCriteria): Observable<Response> {
    const options = new RequestOptions({});

    return this.http.get(this.url + '/export', options)
      .map((response: Response) => {
        return response;
      })
      .catch(this.handleError);
  }

  private handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
        const body = error.json() || '';
        const err = body.error || JSON.stringify(body);
        errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
        errMsg = error.message ? error.message : error.toString();
    }
    console.error('service error: ' + errMsg);
    return Observable.throw(errMsg);
  }
}
