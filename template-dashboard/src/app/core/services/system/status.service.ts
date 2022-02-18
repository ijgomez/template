import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  private url = environment.urlBase + '/api/status';

  /** Default HTTP Options. */
  protected options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }

  serverTimestamp(): Observable<Date> {
    return this.http.get<Date>(`${this.url}/time`, this.options);
  }
}
