import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Delete" button.
 *
 * Unifies the delete action button used in list toolbars and in the read-only
 * header of the entity forms: a danger button with a trash icon, optionally
 * disabled (e.g. while no row is selected), emitting a `delete` event on click.
 */
@Component({
  selector: 'tp-delete-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-danger btn-sm"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="delete.emit()">
      <i class="bi bi-trash me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpDeleteButtonComponent {
  /** Disables the button (typically when no row is selected). */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.delete`. */
  readonly labelKey = input<string>('button.delete');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-delete');

  /** Emitted when the button is clicked. */
  readonly delete = output<void>();
}
