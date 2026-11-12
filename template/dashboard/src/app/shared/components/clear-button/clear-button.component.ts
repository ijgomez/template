import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Clear" button for list filter forms.
 *
 * Unifies the clear-filters action: an outline button with a circled-x icon,
 * emitting a `clear` event on click.
 */
@Component({
  selector: 'tp-clear-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-outline-secondary btn-sm"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="clear.emit()">
      <i class="bi bi-x-circle me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpClearButtonComponent {
  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.clear`. */
  readonly labelKey = input<string>('button.clear');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-filter-clear');

  /** Emitted when the button is clicked. */
  readonly clear = output<void>();
}
