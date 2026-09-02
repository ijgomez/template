import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { ClusterNode } from '../../../../../core/models/cluster.model';

/**
 * Node detail component.
 * Displays the read-only detail view for a single cluster node.
 */
@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, LocalDatePipe],
  templateUrl: './node-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDetailComponent {
  /** The cluster node to display. */
  readonly node = input.required<ClusterNode>();

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  onBack(): void {
    this.back.emit();
  }
}
