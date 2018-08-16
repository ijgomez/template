import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';
import { User } from '../../domain/security/user';
import { UserCriteria } from '../../domain/security/user-criteria';

@Injectable()
export class UsersService extends TemplateService {

  private url = environment.urlBase + '/users';

    private headers = new Headers({'Content-type': 'application/json'});

    constructor(private http: Http) {
      super();
    }

    findByCriteria(criteria: UserCriteria): Observable<User[]> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url + '/search', criteria, options).pipe(
        map((response: Response) => {
          return response.json();
        }),
        catchError(this.handleError)
      );
    }

    countByCriteria(criteria: UserCriteria): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url + '/count', criteria, options).pipe(
        map((response: Response) => {
          return response.json();
        }),
        catchError(this.handleError)
      );
    }

    create(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.post(this.url, user, options).pipe(
        map(success => success.status),
        catchError(this.handleError)
      );
    }

    read(id: number | string): Observable<User> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.get(`${this.url}/${id}`, options).pipe(
        map((response: Response) => {
          return response.json();
        }),
        catchError(this.handleError)
      );
    }

    update(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.put(`${this.url}/${user.id}`, user, options).pipe(
        map((response: Response) => {
          return response.status;
        }),
        catchError(this.handleError)
      );
    }

    delete(user: User): Observable<number> {
      const options = new RequestOptions({ headers: this.headers});

      return this.http.delete(`${this.url}/${user.id}`, options).pipe(
        map((response: Response) => {
          return response.status;
        }),
        catchError(this.handleError)
      );
    }

    export(criteria: UserCriteria): Observable<any> {
      const options = new RequestOptions({});

      return this.http.post(this.url + '/export', criteria, options).pipe(
        map((response: Response) => {
          return response;
        }),
        catchError(this.handleError)
      );
    }

}
