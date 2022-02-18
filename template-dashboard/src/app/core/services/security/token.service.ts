import { Injectable } from '@angular/core';
import { AuthToken } from '../../models/security/auth-token.model';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  signOut() {
    window.sessionStorage.clear();
  }

  public saveToken(token: AuthToken): void {
   // console.log(JSON.stringify(token));
    window.sessionStorage.removeItem(TOKEN_KEY);
    //window.sessionStorage.setItem(TOKEN_KEY, token.accessToken);
    window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  }

  public getToken(): AuthToken | null {
    const token = window.sessionStorage.getItem(TOKEN_KEY);

    if (token) {
      //console.log(JSON.parse(token));

      return JSON.parse(token);
    }
    return null;
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }

    return {};
  }
}
