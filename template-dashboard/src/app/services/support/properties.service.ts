import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Property } from '../../domain/support/property';
import { PropertyCriteria } from '../../domain/support/property-criteria';

@Injectable()
export class PropertiesService {

  private url = environment.urlBase + '/properties';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) { }

  findByCriteria(criteria: PropertyCriteria): Observable<Property[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  countByCriteria(criteria: PropertyCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  create(property: Property): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, property, options).pipe(
      map(success => success.status),
      catchError(this.handleError)
    );
  }

  read(id: number | string): Observable<Property> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  update(property: Property): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${property.id}`, property, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  delete(property: Property): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${property.id}`, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  export(criteria: PropertyCriteria): Observable<any> {
    const options = new RequestOptions({});

    return this.http.post(this.url + '/export', criteria, options).pipe(
      map((response: Response) => {
        return response;
      }),
      catchError(this.handleError)
    );
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
