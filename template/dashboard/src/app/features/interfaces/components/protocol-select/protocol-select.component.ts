import { Component, ChangeDetectionStrategy, Input, computed, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormsModule, NG_VALUE_ACCESSOR, NgForm, ControlValueAccessor } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

/** Available interface protocol values. */
export const INTERFACE_PROTOCOLS = ['REST', 'SOAP', 'LDAP', 'SMTP'] as const;

/** Rendering variant of the protocol selector. */
export type ProtocolSelectVariant = 'select' | 'readonly';

/**
 * Reusable ControlValueAccessor that renders the interface protocol selector.
 *
 * Unifies the two protocol combo boxes that previously lived inline in the
 * configuration list filter and the configuration form (view mode):
 *
 * - `variant="select"` renders a `<select>` with the static protocol list.
 *   Used as a filter, it exposes a selectable empty option ("all protocols")
 *   through {@link placeholderSelectable}.
 * - `variant="readonly"` renders a disabled, read-only `<input>` showing the
 *   textual protocol value. Used inside the form view mode.
 *
 * The form value is the protocol string, or `''` when nothing is selected.
 *
 * Usage (filter):
 * ```html
 * <tp-protocol-select
 *   [(ngModel)]="filterProtocol"
 *   name="filterProtocol"
 *   [placeholderSelectable]="true"
 *   placeholderKey="interfaces.configuration.filters.allProtocols"
 *   ariaLabelKey="interfaces.configuration.fields.protocol"
 *   testId="filter-protocol">
 * </tp-protocol-select>
 * ```
 *
 * Usage (form view):
 * ```html
 * <tp-protocol-select
 *   [ngModel]="config.protocol"
 *   name="protocol"
 *   variant="readonly"
 *   ariaLabelKey="interfaces.configuration.fields.protocol"
 *   testId="input-protocol">
 * </tp-protocol-select>
 * ```
 */
@Component({
  selector: 'tp-protocol-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './protocol-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProtocolSelectComponent),
      multi: true,
    },
  ],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class ProtocolSelectComponent implements ControlValueAccessor {
  /** Static list of available protocols. */
  readonly protocols = INTERFACE_PROTOCOLS;

  // ─── Inputs ────────────────────────────────────────────────

  /** Rendering variant: editable `select` or read-only `input`. */
  @Input() variant: ProtocolSelectVariant = 'select';

  /** Translation key for the empty/placeholder option (filter variant). */
  @Input() placeholderKey = '';

  /**
   * Whether the empty/placeholder option is selectable.
   * `true` for filters ("All protocols"), `false` for required selects.
   */
  @Input() placeholderSelectable = false;

  /** Whether the select is required (adds the `required` attribute). */
  private readonly requiredState = signal(false);

  @Input()
  get required(): boolean {
    return this.requiredState();
  }
  set required(value: boolean) {
    this.requiredState.set(value);
  }

  /** `name` attribute for the inner control (needed inside template-driven forms). */
  @Input() name = 'protocol';

  /** Accessibility label translation key. */
  @Input() ariaLabelKey = '';

  /** data-testid for the inner control. */
  @Input() testId = 'protocol-select';

  // ─── Internal State ────────────────────────────────────────

  /** Currently selected protocol (form model value). */
  readonly selected = signal<string>('');

  /** Whether the component is disabled. */
  readonly disabled = signal(false);

  /** Whether the user has interacted with the control. */
  readonly touched = signal(false);

  /** Whether the required selection is invalid. */
  readonly isInvalid = computed(() => this.required && this.selected() === '' && this.touched());

  // ─── CVA Callbacks ─────────────────────────────────────────

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── ControlValueAccessor ──────────────────────────────────

  writeValue(value: string | null | undefined): void {
    this.selected.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ─── Actions ───────────────────────────────────────────────

  /**
   * Propagates a selection change to the form model.
   */
  onSelectionChange(value: string): void {
    this.touched.set(true);
    this.selected.set(value);
    this.onChange(value);
    this.onTouched();
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}
