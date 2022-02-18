import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { ProfileCriteria } from '../../models/security/profile-criteria.model';
import { Profile } from '../../models/security/profile.model';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Action } from '../../models/security/action.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends TemplateService<Profile, ProfileCriteria> {

  constructor(public http: HttpClient) { super(http, '/api/profiles'); }

  /**
   * Check if a profile's name exists.
   * @param name Name of Profile.
   * @returns 
   */
  existByName(name: String): Observable<Boolean> {

    return this.http.get<Boolean>(`${this.url}/exist/${name}`, this.options).pipe(
        catchError(this.handleError<Boolean>('existByName'))
      );

  }

  /**
   * Actions of Profile.
   * @param id Id Profile.
   * @returns List of Actions.
   */
  actions(id: number): Observable<Action[]> {

    return this.http.get<Action[]>(`${this.url}/${id}/actions`, this.options).pipe(
        catchError(this.handleError<Action[]>('actions'))
      );

  }
}
