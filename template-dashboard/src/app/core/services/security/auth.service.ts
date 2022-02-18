import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Credentials } from '../../models/security/credentials.model';
import { TokenService } from './token.service';
import { AuthToken } from '../../models/security/auth-token.model';
import { CrytoService } from './cryto.service';
import { UserService } from './user.service';
import { Action } from '../../models/security/action.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = environment.urlBase + '/api/auth';
  
  private options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  private expirationDateTime: Date | any;

  private loggedIn = new BehaviorSubject<boolean>(false);

  private actions: String[] = [];

  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private crytoService: CrytoService,
    private userService: UserService
    ) { }

  isAuthorized():boolean {
    const token = this.tokenService.getToken();
    if (token != null && this.expirationDateTime != null) {
      var edate = this.expirationDateTime;
      var now = Date.now();

      if (now < edate.getTime()) {
        this.loggedIn.next(true);
        return true;
      }

      console.warn('token is pressent: ' + (token != null) + 'but is expirated: ' + edate);
    }
    this.loggedIn.next(false);
    return false;
  }

  hasInRole(action: String):boolean {
    console.log("Action: " + action + ' - ' + this.actions.includes(action));
    return true;
  }

  login(credentials: Credentials): Observable<any> {

    console.log('username: ' + credentials.username + ' password: ********');
    var pwd: any = credentials.password;
    credentials.password = this.crytoService.encrypt(this.userService.securityKey(), pwd.toString());

    return this.http.post(this.url + '/login', credentials, this.options).pipe(
      map((data: any) => { 
        this.tokenService.saveToken((data as AuthToken));
        this.tokenService.saveUser(data);

        this.userService.actionsByUsername(credentials.username ? credentials.username  : '').pipe(
          map( (as: Action[]) => { 
             return as.map(s => (s.name)); 
          })
        ).subscribe(
          (r:String[]) => { this.actions = r }
        );
        
        this.expirationDateTime =  new Date(Date.now() + ((data as AuthToken)?.expiresIn * 60 * 1000));
        this.loggedIn.next(true);
        return data;
      })
    );
  }

  logout() {
    console.warn("...logout!");
  }
}
