import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';
import { Profile } from '../../domain/security/profile';
import { ProfileCriteria } from '../../domain/security/profile-criteria';

@Injectable()
export class ProfilesService extends TemplateService {

  private url = environment.urlBase + '/profiles';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) {
    super();
   }

  loadAll(): Observable<Profile[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(this.url, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  findByCriteria(criteria: ProfileCriteria): Observable<Profile[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  countByCriteria(criteria: ProfileCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  create(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, profile, options).pipe(
      map(success => success.status),
      catchError(this.handleError)
    );
  }

  read(id: number | string): Observable<Profile> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  update(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${profile.id}`, profile, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  delete(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${profile.id}`, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  export(criteria: ProfileCriteria): Observable<any> {
    const options = new RequestOptions({});

    return this.http.post(this.url + '/export', criteria, options).pipe(
      map((response: Response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

}
