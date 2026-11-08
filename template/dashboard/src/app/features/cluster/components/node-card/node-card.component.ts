import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Presentational card showing the cluster nodes status (active / total).
 * Handles loading, error and value states; data loading is owned by the parent.
 */
@Component({
  selector: 'tp-node-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './node-card.component.html',
  styleUrls: ['./node-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpNodeCardComponent {
  /** Number of active nodes. */
  readonly activeNodes = input<number>(0);
  /** Total number of nodes. */
  readonly totalNodes = input<number>(0);
  /** Whether the nodes are being loaded. */
  readonly loading = input<boolean>(false);
  /** Whether loading the nodes failed. */
  readonly error = input<boolean>(false);

  readonly inactiveNodes = computed(() => this.totalNodes() - this.activeNodes());
  readonly allNodesOperational = computed(() => this.totalNodes() > 0 && this.inactiveNodes() === 0);
}
