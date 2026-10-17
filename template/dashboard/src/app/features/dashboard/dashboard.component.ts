import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ClusterService } from '../../core/services/cluster.service';

/**
 * Dashboard component.
 * Displays system overview: stats cards, recent activity, system status, and quick links.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);

  readonly lastAccess = '04/08/2026 19:15';

  // ─── Cluster nodes state ─────────────────────────────────────
  /** Whether the cluster nodes are being loaded. */
  readonly nodesLoading = signal(true);
  /** Whether loading the cluster nodes failed. */
  readonly nodesError = signal(false);
  /** Number of nodes with ACTIVE status. */
  readonly activeNodes = signal(0);
  /** Total number of registered nodes. */
  readonly totalNodes = signal(0);

  /** Number of non-active (inactive) nodes. */
  readonly inactiveNodes = computed(() => this.totalNodes() - this.activeNodes());
  /** Whether every registered node is active. */
  readonly allNodesOperational = computed(() => this.totalNodes() > 0 && this.inactiveNodes() === 0);

  ngOnInit(): void {
    this.loadClusterNodes();
  }

  /**
   * Loads the cluster nodes from the backend and computes active/total counts.
   */
  private loadClusterNodes(): void {
    this.nodesLoading.set(true);
    this.nodesError.set(false);

    this.clusterService.findAllNodes().subscribe({
      next: (nodes) => {
        this.totalNodes.set(nodes.length);
        this.activeNodes.set(nodes.filter((n) => n.status === 'ACTIVE').length);
        this.nodesLoading.set(false);
      },
      error: () => {
        this.nodesError.set(true);
        this.nodesLoading.set(false);
      },
    });
  }
}
