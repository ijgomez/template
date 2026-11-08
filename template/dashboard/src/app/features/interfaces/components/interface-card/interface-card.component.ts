import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Presentational card showing the number of configured interfaces and how many are in error.
 * Handles loading, error and value states; data loading is owned by the parent.
 */
@Component({
  selector: 'tp-interface-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './interface-card.component.html',
  styleUrls: ['./interface-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpInterfaceCardComponent {
  /** Total number of configured interfaces. */
  readonly total = input<number>(0);
  /** Number of interfaces in ERROR status. */
  readonly withError = input<number>(0);
  /** Whether the interfaces are being loaded. */
  readonly loading = input<boolean>(false);
  /** Whether loading the interfaces failed. */
  readonly error = input<boolean>(false);
}
