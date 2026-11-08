import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Presentational card showing the total number of users.
 * Handles loading, error and value states; data loading is owned by the parent.
 */
@Component({
  selector: 'tp-user-card',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpUserCardComponent {
  /** Total number of users. */
  readonly total = input<number>(0);
  /** Whether the total is being loaded. */
  readonly loading = input<boolean>(false);
  /** Whether loading the total failed. */
  readonly error = input<boolean>(false);
}
