import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, RequestMethod } from '@angular/http';
import { environment } from '../../../environments/environment';
import { ProfileCriteria } from '../../domain/security/profile-criteria';
import { Profile } from '../../domain/security/profile';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class ProfilesService {

  private url = environment.urlBase + '/profiles';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) { }

  loadAll(): Observable<Profile[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(this.url, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  findByCriteria(criteria: ProfileCriteria): Observable<Profile[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  countByCriteria(criteria: ProfileCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  create(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, profile, options)
      .map(success => success.status)
      .catch(this.handleError);
  }

  read(id: number | string): Observable<Profile> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options)
      .map((response: Response) => {
        return response.json();
      })
      .catch(this.handleError);
  }

  update(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${profile.id}`, profile, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  delete(profile: Profile): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${profile.id}`, options)
      .map((response: Response) => {
        return response.status;
      })
      .catch(this.handleError);
  }

  export(criteria: ProfileCriteria): Observable<any> {
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
