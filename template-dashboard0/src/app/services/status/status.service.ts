import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable, Observer } from 'rxjs/Rx';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class StatusService {

  private url = environment.urlBase + '/status';

  constructor(private http: Http) { }

  serverTimestamp(): Observable<Date> {
    const headers = new Headers({'Content-type': 'application/json'});
    const options = new RequestOptions({ headers: headers});

    return this.http.get(this.url + '/time', options)
      .map((response: Response) => response.json())
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
