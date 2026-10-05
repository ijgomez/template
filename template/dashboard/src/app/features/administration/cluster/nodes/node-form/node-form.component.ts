import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { ClusterNode } from '../../../../../core/models/cluster.model';
import { NodeJobsComponent } from '../../../components/node-jobs/node-jobs.component';

/**
 * Node form component.
 * Shows the cluster node attributes always in read-only mode (Req 25.11)
 * and lets the user manage the jobs (ClusterJob) assigned to the node.
 * Replaces the former node-detail view.
 */
@Component({
  selector: 'app-node-form',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, LocalDatePipe, NodeJobsComponent],
  templateUrl: './node-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeFormComponent {
  /** The cluster node to display (always read-only). */
  readonly node = input.required<ClusterNode>();

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  onBack(): void {
    this.back.emit();
  }
}
