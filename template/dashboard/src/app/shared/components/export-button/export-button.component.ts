import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "Export" toolbar button.
 *
 * Unifies the export action used across list views: an outline button with a
 * download icon, emitting an `export` event on click. Use the host `class`
 * (e.g. `class="ms-auto"`) to position it in the toolbar.
 */
@Component({
  selector: 'tp-export-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-outline-secondary btn-sm"
      [disabled]="disabled()"
      [attr.data-testid]="testId()"
      (click)="export.emit()">
      <i class="bi bi-download me-1" aria-hidden="true"></i>{{ labelKey() | translate }}{{ labelSuffix() }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpExportButtonComponent {
  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Translation key for the button label. Defaults to `button.export`. */
  readonly labelKey = input<string>('button.export');

  /** Literal text appended to the translated label (e.g. ` CSV`). */
  readonly labelSuffix = input<string>('');

  /** Optional `data-testid` for testing. */
  readonly testId = input<string>('btn-export');

  /** Emitted when the button is clicked. */
  readonly export = output<void>();
}
