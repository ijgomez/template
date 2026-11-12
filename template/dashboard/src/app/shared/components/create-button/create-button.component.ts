import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Create" toolbar button.
 *
 * Unifies the create action button used across list views: a primary button
 * with a plus icon, emitting a `create` event on click.
 */
@Component({
  selector: 'tp-create-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-primary btn-sm"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="create.emit()">
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpCreateButtonComponent {
  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.create`. */
  readonly labelKey = input<string>('button.create');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-create');

  /** Emitted when the button is clicked. */
  readonly create = output<void>();
}
