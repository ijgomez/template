import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { ActionCriteria } from '../../models/security/action-criteria.model';
import { Action } from '../../models/security/action.model';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ActionService extends TemplateService<Action, ActionCriteria> {

  constructor(public http: HttpClient) { super(http, '/api/actions'); }

  existByName(name: String): Observable<Boolean> {

    return this.http.get<Boolean>(`${this.url}/exist/${name}`, this.options).pipe(
        catchError(this.handleError<Boolean>('existByName'))
      );

  }
}
