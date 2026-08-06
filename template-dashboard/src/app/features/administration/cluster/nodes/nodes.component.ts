import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef } from '../../../../shared/components/data-table';
import { ClusterNode } from '../../../../core/models/cluster.model';

/**
 * Cluster nodes component.
 * Displays all cluster nodes with status and master indicators.
 * Allows setting a node as master (with confirmation) when user has CLUSTER_NODE_WRITE action.
 * Client-side filtering and pagination for consistency with mockup pattern.
 * No create/delete operations per Req 25.11.
 */
@Component({
  selector: 'app-cluster-nodes',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './nodes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // Data state
  readonly allNodes = signal<ClusterNode[]>([]);
  readonly isLoading = signal(false);

  // Selection
  readonly selectedRow = signal<ClusterNode | null>(null);

  // Filters
  readonly filterHostname = signal('');
  readonly filterStatus = signal('');
  readonly filterMaster = signal('');

  // Pagination
  readonly pageSizes = [5, 10, 20, 50];
  readonly pageSize = signal(10);
  readonly currentPage = signal(0);

  // Computed: filtered nodes
  readonly filteredNodes = computed(() => {
    let nodes = this.allNodes();
    const hostname = this.filterHostname().trim().toLowerCase();
    const status = this.filterStatus();
    const master = this.filterMaster();

    if (hostname) {
      nodes = nodes.filter((n) => n.hostname.toLowerCase().includes(hostname));
    }
    if (status) {
      nodes = nodes.filter((n) => n.status === status);
    }
    if (master) {
      const isMaster = master === 'true';
      nodes = nodes.filter((n) => n.master === isMaster);
    }
    return nodes;
  });

  // Computed: pagination metadata
  readonly totalElements = computed(() => this.filteredNodes().length);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);
  readonly paginatedNodes = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredNodes().slice(start, start + this.pageSize());
  });
  readonly showingFrom = computed(() => (this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1));
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Confirmation dialog state
  readonly showConfirmDialog = signal(false);
  readonly confirmNodeId = signal<number | null>(null);
  readonly confirmNodeHostname = signal('');

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'hostname', header: 'cluster.nodes.fields.hostname' },
    { key: 'status', header: 'cluster.nodes.fields.status' },
    { key: 'master', header: 'cluster.nodes.fields.master' },
    { key: 'memory', header: 'cluster.nodes.fields.freeMemory' },
    { key: 'createdAt', header: 'cluster.nodes.fields.createdAt' },
    { key: 'lastModifiedAt', header: 'cluster.nodes.fields.lastModifiedAt' },
  ];

  // Permission
  readonly canWrite = this.authService.hasAction('CLUSTER_NODE_WRITE');

  ngOnInit(): void {
    this.loadNodes();
  }

  /**
   * Loads all cluster nodes from the backend.
   */
  loadNodes(): void {
    this.isLoading.set(true);
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.clusterService.findAllNodes().subscribe({
      next: (nodes) => {
        this.allNodes.set(nodes);
        this.isLoading.set(false);
        this.notificationService.dismiss(progressId);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.updateToError(progressId, 'notification.error');
      },
    });
  }

  /**
   * Selects or deselects a row in the table.
   */
  selectRow(node: ClusterNode): void {
    this.selectedRow.set(this.selectedRow()?.id === node.id ? null : node);
  }

  /**
   * Applies filters and resets pagination.
   */
  applyFilters(): void {
    this.currentPage.set(0);
    this.selectedRow.set(null);
  }

  /**
   * Clears all filters and resets pagination.
   */
  clearFilters(): void {
    this.filterHostname.set('');
    this.filterStatus.set('');
    this.filterMaster.set('');
    this.currentPage.set(0);
    this.selectedRow.set(null);
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Changes the page size and resets to page 0.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
  }

  /**
   * Opens the confirmation dialog for the currently selected row.
   */
  designateMasterSelected(): void {
    const node = this.selectedRow();
    if (node && !node.master) {
      this.confirmSetMaster(node);
    }
  }

  /**
   * Opens the confirmation dialog before setting a node as master.
   */
  confirmSetMaster(node: ClusterNode): void {
    this.confirmNodeId.set(node.id);
    this.confirmNodeHostname.set(node.hostname);
    this.showConfirmDialog.set(true);
  }

  /**
   * Cancels the set master operation.
   */
  cancelSetMaster(): void {
    this.showConfirmDialog.set(false);
    this.confirmNodeId.set(null);
    this.confirmNodeHostname.set('');
  }

  /**
   * Confirms and executes the set master operation.
   */
  executeSetMaster(): void {
    const nodeId = this.confirmNodeId();
    if (nodeId === null) {
      return;
    }

    this.showConfirmDialog.set(false);
    const progressId = this.notificationService.showProgress('notification.save.progress');

    this.clusterService.setMaster(nodeId, true).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.save.success');
        this.confirmNodeId.set(null);
        this.confirmNodeHostname.set('');
        this.selectedRow.set(null);
        this.loadNodes();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.save.error');
        this.confirmNodeId.set(null);
        this.confirmNodeHostname.set('');
      },
    });
  }

  /**
   * Exports the current filtered data as CSV.
   */
  exportCsv(): void {
    const nodes = this.filteredNodes();
    if (nodes.length === 0) {
      return;
    }

    const headers = [
      this.translateService.instant('cluster.nodes.fields.hostname'),
      this.translateService.instant('cluster.nodes.fields.status'),
      this.translateService.instant('cluster.nodes.fields.master'),
      this.translateService.instant('cluster.nodes.fields.freeMemory'),
      this.translateService.instant('cluster.nodes.fields.totalMemory'),
      this.translateService.instant('cluster.nodes.fields.usedMemory'),
      this.translateService.instant('cluster.nodes.fields.createdAt'),
      this.translateService.instant('cluster.nodes.fields.lastModifiedAt'),
    ];

    const rows = nodes.map((n) => [
      n.hostname,
      n.status,
      n.master ? 'MASTER' : '',
      n.freeMemory,
      n.totalMemory,
      n.usedMemory,
      n.createdAt,
      n.lastModifiedAt,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cluster-nodes.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
