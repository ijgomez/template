import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Filter" button for list filter forms.
 *
 * Unifies the apply-filters action: a primary button with a search icon. By
 * default it is a `submit` button so the enclosing form's `(ngSubmit)` runs;
 * use `type="button"` together with the `(filter)` event when there is no form.
 */
@Component({
  selector: 'tp-filter-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      class="btn btn-primary btn-sm"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="filter.emit()">
      <i class="bi bi-search me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpFilterButtonComponent {
  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.filter`. */
  readonly labelKey = input<string>('button.filter');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-filter-search');

  /** Native button type. Defaults to `submit`. */
  readonly type = input<'submit' | 'button'>('submit');

  /** Emitted when the button is clicked. */
  readonly filter = output<void>();
}
