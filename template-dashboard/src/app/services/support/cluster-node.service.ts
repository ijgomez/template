import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TemplateService } from '../base/template-service';
import { ClusterNodeCriteria } from '../../domain/support/cluster-node-criteria';
import { ClusterNode } from '../../domain/support/cluster-node';

@Injectable()
export class ClusterNodeService extends TemplateService {

  private url = environment.urlBase + '/cluster';

  private headers = new Headers({'Content-type': 'application/json'});

  constructor(private http: Http) { 
    super();
  }

  findByCriteria(criteria: ClusterNodeCriteria): Observable<ClusterNode[]> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/search', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  countByCriteria(criteria: ClusterNodeCriteria): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url + '/count', criteria, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  create(clusterNode: ClusterNode): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.post(this.url, clusterNode, options).pipe(
      map(success => success.status),
      catchError(this.handleError)
    );
  }

  read(id: number | string): Observable<ClusterNode> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.get(`${this.url}/${id}`, options).pipe(
      map((response: Response) => {
        return response.json();
      }),
      catchError(this.handleError)
    );
  }

  update(clusterNode: ClusterNode): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.put(`${this.url}/${clusterNode.id}`, clusterNode, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  delete(clusterNode: ClusterNode): Observable<number> {
    const options = new RequestOptions({ headers: this.headers});

    return this.http.delete(`${this.url}/${clusterNode.id}`, options).pipe(
      map((response: Response) => {
        return response.status;
      }),
      catchError(this.handleError)
    );
  }

  export(criteria: ClusterNodeCriteria): Observable<any> {
    const options = new RequestOptions({});

    return this.http.post(this.url + '/export', criteria, options).pipe(
      map((response: Response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }
}
