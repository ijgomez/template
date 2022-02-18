import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { UserCriteria } from '../../models/security/user-criteria.model';
import { User } from '../../models/security/user.model';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CrytoService } from './cryto.service';
import { Action } from '../../models/security/action.model';

@Injectable({
  providedIn: 'root'
})
export class UserService extends TemplateService<User, UserCriteria> {

  private SECURITY_KEY: string = '123456$#@$^@1ERF';

  constructor(
      public http: HttpClient,
      private crytoService: CrytoService
    ) { 
    super(http, '/api/users'); 
  }

  public securityKey(): string {
    return this.SECURITY_KEY;
  }

  create(u: User): Observable<number> {
    u.password = this.crytoService.encrypt(this.securityKey(), u.password.toString());
    return super.create(u);
  }

  read(id: number): Observable<User> {
      return super.read(id).pipe(
        map( (data: User) => { 
          data.password = this.crytoService.decrypt(this.securityKey(), data.password.toString());
          return data; 
        })
      );
  }

  update(u: User): Observable<number> {
    u.password = this.crytoService.encrypt(this.securityKey(), u.password.toString());
    return super.update(u);
  }

  existByUsername(username: String): Observable<Boolean> {

    return this.http.get<Boolean>(`${this.url}/exist/${username}`, this.options).pipe(
        catchError(this.handleError<Boolean>('existByUsername'))
      );

  }

  actionsByUsername(username: String): Observable<Action[]> {
    return this.http.get<Action[]>(`${this.url}/${username}/actions`, this.options).pipe(

      catchError(this.handleError<Action[]>('actions'))
    );
  }

}
