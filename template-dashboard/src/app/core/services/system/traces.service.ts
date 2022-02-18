import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { TraceCriteria } from '../../models/system/trace-criteria.model';
import { Trace } from '../../models/system/trace.model';
import { Observable } from 'rxjs';
import { TraceType } from '../../models/system/trace-type.model';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TracesService extends TemplateService<Trace, TraceCriteria> {

  constructor(public http: HttpClient) { super(http, '/api/traces'); }
  
  types(): Observable<TraceType[]> {
    return this.http.get<TraceType[]>(`${this.url}/types`, this.options).pipe(
      map((response: TraceType[]) => {
        return response;
      }),
      catchError(this.handleError<TraceType[]>('types'))
    );
  }
}
