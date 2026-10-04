import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ClusterNode, ClusterBlock, ClusterBlockCriteria, ClusterJob, ClusterTask } from '../models/cluster.model';
import { Page } from '../models/page.model';

/** Page size used to fetch the full filtered list for exports (bypasses UI pagination). */
const EXPORT_PAGE_SIZE = 100000;

/**
 * Service for querying cluster nodes and blocks via the backend API.
 * Nodes: read + patch master only. Blocks: read-only.
 */
@Injectable({ providedIn: 'root' })
export class ClusterService {
  private readonly http = inject(HttpClient);
  private readonly clusterUrl = `${environment.apiUrl}/administration/cluster`;
  private readonly nodesUrl = `${this.clusterUrl}/nodes`;
  private readonly blocksUrl = `${this.clusterUrl}/blocks`;
  private readonly tasksUrl = `${this.clusterUrl}/tasks`;

  // ─── Nodes ─────────────────────────────────────────────────

  /**
   * Retrieves all cluster nodes.
   */
  findAllNodes(): Observable<ClusterNode[]> {
    return this.http.get<ClusterNode[]>(this.nodesUrl);
  }

  /**
   * Retrieves a single cluster node by ID.
   */
  findNodeById(id: number): Observable<ClusterNode> {
    return this.http.get<ClusterNode>(`${this.nodesUrl}/${id}`);
  }

  /**
   * Updates the master status of a node (PATCH).
   */
  setMaster(id: number, master: boolean): Observable<ClusterNode> {
    return this.http.patch<ClusterNode>(`${this.nodesUrl}/${id}`, { master });
  }

  // ─── Jobs ──────────────────────────────────────────────────

  /**
   * Retrieves the jobs assigned to a node, ordered by priority.
   */
  findJobsByNode(nodeId: number): Observable<ClusterJob[]> {
    return this.http.get<ClusterJob[]>(`${this.nodesUrl}/${nodeId}/jobs`);
  }

  /**
   * Assigns a task to a node (POST). The node id is taken from the path.
   */
  assignJob(nodeId: number, job: ClusterJob): Observable<ClusterJob> {
    return this.http.post<ClusterJob>(`${this.nodesUrl}/${nodeId}/jobs`, job);
  }

  /**
   * Updates an existing job of a node (PUT).
   */
  updateJob(nodeId: number, taskId: number, job: ClusterJob): Observable<ClusterJob> {
    return this.http.put<ClusterJob>(`${this.nodesUrl}/${nodeId}/jobs/${taskId}`, job);
  }

  /**
   * Removes a job from a node (DELETE).
   */
  deleteJob(nodeId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.nodesUrl}/${nodeId}/jobs/${taskId}`);
  }

  // ─── Tasks ─────────────────────────────────────────────────

  /**
   * Retrieves the full catalogue of cluster tasks.
   */
  findAllTasks(): Observable<ClusterTask[]> {
    return this.http.get<ClusterTask[]>(this.tasksUrl);
  }

  // ─── Blocks ────────────────────────────────────────────────

  /**
   * Retrieves a paginated list of cluster blocks with optional filters.
   */
  findBlocksByCriteria(criteria: ClusterBlockCriteria, page: number, size: number, sort?: string): Observable<Page<ClusterBlock>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    if (criteria.name) {
      params = params.set('name', criteria.name);
    }

    return this.http.get<Page<ClusterBlock>>(this.blocksUrl, { params });
  }

  /**
   * Retrieves the full list of cluster blocks matching the given filters, ignoring UI pagination.
   * Used for exports so the exported file reflects all filtered rows, not just the current page.
   */
  findAllBlocksByCriteria(criteria: ClusterBlockCriteria, sort?: string): Observable<ClusterBlock[]> {
    return this.findBlocksByCriteria(criteria, 0, EXPORT_PAGE_SIZE, sort).pipe(map((page) => page.content));
  }

  /**
   * Returns the total count of cluster blocks matching the given criteria.
   */
  countBlocksByCriteria(criteria: ClusterBlockCriteria): Observable<number> {
    let params = new HttpParams();

    if (criteria.name) {
      params = params.set('name', criteria.name);
    }

    return this.http.get<number>(`${this.blocksUrl}/count`, { params });
  }

  /**
   * Retrieves a single cluster block by ID.
   */
  findBlockById(id: number): Observable<ClusterBlock> {
    return this.http.get<ClusterBlock>(`${this.blocksUrl}/${id}`);
  }
}
