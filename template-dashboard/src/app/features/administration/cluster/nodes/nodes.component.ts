import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { ClusterNode } from '../../../../core/models/cluster.model';

/**
 * Cluster nodes component.
 * Displays all cluster nodes with status and master indicators.
 * Allows setting a node as master (with confirmation) when user has CLUSTER_NODE_WRITE action.
 * No create/delete operations per Req 25.11.
 */
@Component({
  selector: 'app-cluster-nodes',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './nodes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // Data state
  readonly nodes = signal<ClusterNode[]>([]);
  readonly isLoading = signal(false);

  // Confirmation dialog state
  readonly showConfirmDialog = signal(false);
  readonly confirmNodeId = signal<number | null>(null);
  readonly confirmNodeHostname = signal('');

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
        this.nodes.set(nodes);
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
        this.loadNodes();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.save.error');
        this.confirmNodeId.set(null);
        this.confirmNodeHostname.set('');
      },
    });
  }
}
