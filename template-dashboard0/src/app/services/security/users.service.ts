import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Rx';
import { UserCriteria } from '../../domain/security/user-criteria';
import { User } from '../../domain/security/user';

@Injectable()
export class UsersService {

  private url = environment.urlBase + '/users';

    private headers = new Headers({'Content-type': 'application/json'});

    constructor(private http: Http) { }

    findByCriteria(criteria: UserCriteria): Observable<User[]> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url + '/search', criteria, options)
        .map((response: Response) => {
          return response.json();
        })
        .catch(this.handleError);
    }

    countByCriteria(criteria: UserCriteria): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url + '/count', criteria, options)
        .map((response: Response) => {
          return response.json();
        })
        .catch(this.handleError);
    }

    create(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url, user, options)
        .map(success => success.status)
        .catch(this.handleError);
    }

    read(id: number | string): Observable<User> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.get(`${this.url}/${id}`, options)
        .map((response: Response) => {
          return response.json();
        })
        .catch(this.handleError);
    }

    update(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.put(`${this.url}/${user.id}`, user, options)
        .map((response: Response) => {
          return response.status;
        })
        .catch(this.handleError);
    }

    delete(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.delete(`${this.url}/${user.id}`, options)
        .map((response: Response) => {
          return response.status;
        })
        .catch(this.handleError);
    }

    export(criteria: UserCriteria): Observable<any> {
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
