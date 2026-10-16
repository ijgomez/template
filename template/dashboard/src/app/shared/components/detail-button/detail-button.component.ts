import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Detail" toolbar button.
 *
 * Unifies the detail action button used across list views (users, profiles,
 * actions, parameters, audit, cluster nodes) following the pattern established
 * in the interfaces monitor: a primary button with an eye icon, disabled while
 * no row is selected, emitting a `detail` event on click.
 */
@Component({
  selector: 'tp-detail-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-outline-secondary btn-sm"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="detail.emit()">
      <i class="bi bi-eye me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpDetailButtonComponent {
  /** Disables the button (typically when no row is selected). */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `common.detail`. */
  readonly labelKey = input<string>('common.detail');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-detail');

  /** Emitted when the button is clicked. */
  readonly detail = output<void>();
}
