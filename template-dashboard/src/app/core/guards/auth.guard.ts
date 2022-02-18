import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/security/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if user is authorized
    if (!this.authService.isAuthorized()) {
      this.routeToLogin(state);
      return false;
    }

    // Check if user's role has the action
    const action = route.data.action;
    if (!this.authService.hasInRole(action)) {
      this.router.navigate(['error', 'not-found']);
      return false;
    }

    return true;
  }

  private routeToLogin(state: RouterStateSnapshot): void {
    console.log('state.url: ' + state.url + ' (' + (state.url != '/') + ')');
    if (state.url != '/') {
      this.router.navigate(['/login'], {
        queryParams: {
          return: state.url
        },
        replaceUrl: false
      });
    } else {
      this.router.navigate(['/login'], { replaceUrl: false});
    }
  }
  
}
