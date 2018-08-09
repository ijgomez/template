import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Rx';
import { TraceCriteria } from '../../domain/support/trace-criteria';
import { Trace } from '../../domain/support/trace';

@Injectable()
export class TracesService {

  private url = environment.urlBase + '/traces';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) { }

  findByCriteria(criteria: TraceCriteria): Observable<Trace[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  countByCriteria(criteria: TraceCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  create(trace: Trace): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, trace, options)
      .map(success => success.status)
      .catch(this.handleError);
  }

  read(id: number | string): Observable<Trace> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  update(trace: Trace): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${trace.id}`, trace, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  delete(trace: Trace): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${trace.id}`, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  export(criteria: TraceCriteria): Observable<any> {
    const options = new RequestOptions({});

    return this.http.post(this.url + '/export', criteria, options)
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
