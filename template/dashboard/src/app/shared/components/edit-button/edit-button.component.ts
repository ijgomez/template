import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Edit" button.
 *
 * Unifies the edit action button used in list toolbars and in the read-only
 * header of the entity forms: a button with a pencil icon, optionally disabled
 * (e.g. while no row is selected), emitting an `edit` event on click.
 */
@Component({
  selector: 'tp-edit-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-sm"
      [class.btn-outline-secondary]="variant() === 'outline-secondary'"
      [class.btn-primary]="variant() === 'primary'"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="edit.emit()">
      <i class="bi bi-pencil me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpEditButtonComponent {
  /** Disables the button (typically when no row is selected). */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.edit`. */
  readonly labelKey = input<string>('button.edit');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-edit');

  /** Visual style: `outline-secondary` for list toolbars, `primary` for form headers. */
  readonly variant = input<'outline-secondary' | 'primary'>('outline-secondary');

  /** Emitted when the button is clicked. */
  readonly edit = output<void>();
}
