import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { ClusterBlock } from '../../../../../core/models/cluster.model';

/**
 * Cluster block detail component.
 * Displays the read-only detail view for a single cluster block.
 */
@Component({
  selector: 'app-cluster-block-detail',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe],
  templateUrl: './block-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDetailComponent {
  /** The block to display. */
  readonly block = input.required<ClusterBlock>();

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  onBack(): void {
    this.back.emit();
  }
}
