import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../services/security/token.service';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

const TOKEN_HEADER_KEY = 'Authorization';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.tokenService.getToken();

    let authRequest;
    if (token != null) {
      //console.log('Adding TOKEN_HEADER_KEY...');
      authRequest = request.clone({ 
        headers: request.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token.accessToken),
        withCredentials: true
      });
    } else {
      authRequest = request;
    }

    //console.log(authRequest);
    return next.handle(authRequest).pipe(tap( 
      () => {}, 
      (error:any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status == 401) {
            this.router.navigate(['/login']);
          }
          return;
        }
      }
    ));
  }
}
