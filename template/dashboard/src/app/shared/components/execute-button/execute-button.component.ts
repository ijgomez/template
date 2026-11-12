import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Execute" button.
 *
 * Unifies the execute action (e.g. running a report): a primary button with a
 * play icon. By default it is a `submit` button so the enclosing form's
 * `(ngSubmit)` runs; use `type="button"` together with `(execute)` otherwise.
 */
@Component({
  selector: 'tp-execute-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      class="btn btn-primary btn-sm"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="execute.emit()">
      <i class="bi bi-play-fill me-1" aria-hidden="true"></i>{{ labelKey() | translate }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpExecuteButtonComponent {
  /** Disables the button (e.g. while an execution is running). */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.execute`. */
  readonly labelKey = input<string>('button.execute');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-execute');

  /** Native button type. Defaults to `submit`. */
  readonly type = input<'submit' | 'button'>('submit');

  /** Emitted when the button is clicked. */
  readonly execute = output<void>();
}
