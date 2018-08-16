import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';

@Injectable()
export class StatusService extends TemplateService {

  private url = environment.urlBase + '/status';

  constructor(private http: Http) {
    super();
  }

  serverTimestamp(): Observable<Date> {
    const headers = new Headers({'Content-type': 'application/json'});
    const options = new RequestOptions({ headers: headers});

    return this.http.get(this.url + '/time', options).pipe(
      map((response: Response) => response.json()),
      catchError(this.handleError)
    );
  }

}
