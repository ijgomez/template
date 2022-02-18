import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataTableResponse } from '../../models/base/data-table-response.model';
import { Entity } from '../../models/base/entity.model';

@Injectable({
  providedIn: 'root'
})
export abstract class TemplateService<T extends Entity, C> {

  /** Default HTTP Options. */
  protected options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  /** URL. */
  protected url;

  /**
   * New Instance.
   * @param http HTTP Client.
   * @param entityURL URL Base of Entity.
   */
  constructor(
      public http: HttpClient,
      private entityURL: String
    ) { 
      this.url = environment.urlBase + entityURL;
    }

  /**
   * Find by Criteria.
   * @param criteria Criteria.
   * @returns 
   */
  findByCriteria(criteria: C): Observable<T[]> {
    return this.http.post<T[]>(this.url + '/search', criteria, this.options).pipe(
//      tap(_ => console.log(`findByCriteria criteria=${criteria}`)),
//      map( (data: User[]) => { return data; }),
      catchError(this.handleError<T[]>('findByCriteria'))
    );
  }

  /**
   * Count by Criteria.
   * @param criteria Criteria
   * @returns 
   */
  countByCriteria(criteria: C): Observable<number> {
    return this.http.post<number>(this.url + '/count', criteria, this.options).pipe(
//      tap(_ => console.log(`countByCriteria criteria=${criteria}`)),
//      map( (data: number) => { return data; }),
      catchError(this.handleError<number>('countByCriteria'))
    );
  }

  /**
   * 
   * @param criteria Criteria
   * @param dataTablesParameters Database Parameters.
   * @returns 
   */
  datatable(criteria: C, dataTablesParameters: any): Observable<DataTableResponse> {
    return this.http.post<DataTableResponse>(this.url + '/datatables', { criteria: criteria, parameters: dataTablesParameters }, this.options).pipe(
//       tap(_ => console.log(`datatable dataTablesParameters=${dataTablesParameters}`)),
//       map( (data: DataTableResponse) => { return data; }),
      catchError(this.handleError<DataTableResponse>('datatable'))
    );
  }

  /**
   * Create a new entity.
   * @param t entity.
   * @returns 
   */
  create(t: T): Observable<number> {
    return this.http.post<number>(this.url, t, this.options).pipe(
//      tap(_ => console.log(`create ${t}`)),
//      map( (data: number) => { return data; }),
      catchError(this.handleError<number>('create'))
    );
  }

  /**
   * Read a entity.
   * @param id id of entity.
   * @returns 
   */
  read(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`, this.options).pipe(
//      tap(_ => console.log(`read by ${id}`)),
//      map( (data: User) => { return data; }),
      catchError(this.handleError<T>('read'))
    );
  }

  /**
   * Update a entity.
   * @param t entity.
   * @returns 
   */
  update(t: T): Observable<number> {
    return this.http.put<number>(`${this.url}/${t.id}`, t, this.options).pipe(
//      tap(_ => console.log(`update by ${t}`)),
//      map( (data: number) => { return data; }),
      catchError(this.handleError<number>('update'))
    );
  }

  /**
   * Delete a entity.
   * @param t entity.
   * @returns 
   */
  delete(t: T): Observable<number> {
    return this.http.delete<number>(`${this.url}/${t.id}`, this.options).pipe(
//      tap(_ => console.log(`delete by ${id}`)),
//      map( (data: number) => { return data; }),
      catchError(this.handleError<number>('delete'))
    );
  }

  /**
   * Export a data.
   * @param criteria 
   * @returns 
   */
  export(criteria: C): Observable<any> {
    return this.http.post(this.url + '/export', criteria, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      catchError(this.handleError<any>('export'))
    );
  }

  /**
   * 
   * @param operation 
   * @param result 
   * @returns 
   */
  protected handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      let title: string | undefined;
      let message: string | undefined;
      let type: string | undefined;
      let detailsError: any | undefined;

      // console.error(error);
      if (error instanceof HttpErrorResponse) {
        type = 'HttpErrorResponse';
          title = `service operation ${operation} failed: ${error.statusText} (${error.status})`;
          message = error.message;
          detailsError = error.error;

      } else if (error instanceof Response) {
        type = 'Response';
          title = `service operation ${operation} failed: ${error.statusText} (${error.status})`;
          message = JSON.stringify(error.json());
          detailsError = error.body;
      } else {
        type = 'Generic';
          title = `service operation ${operation} failed: Generic Error!!!`;
          message = error.message ? error.message : error.toString();
          detailsError = null;
      }
      
      // Let the app keep running by returning an empty result.
      //return of(result as T);
      return throwError({
        category: 'ERROR',
        type: type,
        title: title,
        message: message,
        details: detailsError
      });
    };
  }

  protected readBlob(blob: Blob): Observable<any> {
    const reader = new FileReader();
    const o = new Observable((observer: any) => {
      reader.onload = (e) => { };
      reader.onloadend = (end) => {
        observer.next(JSON.parse(reader.result as string));
        observer.complete();
      };
    });
    reader.readAsText(blob);
    return o;
  }
}
