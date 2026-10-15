import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { InterfaceService } from '../../../../core/services/interface.service';
import { InterfaceConfig } from '../../../../core/models/interface.model';

/**
 * Reusable ControlValueAccessor component that renders an interface selector.
 *
 * - Loads the available interface configurations on its own via
 *   {@link InterfaceService.findAllConfigurations}, which maps the backend
 *   {@code Interface} entity through {@code InterfaceService} to
 *   {@code InterfaceDTO}.
 * - Writes the selected interface **name** (`string`) as the form value, or
 *   `''` when nothing is selected. The name is used (instead of the id) because
 *   interface operation logs correlate to their interface by name, and that is
 *   the field the backend monitor endpoint filters on.
 * - Supports two placeholder styles through inputs:
 *   - A disabled placeholder for required selects (e.g. forms).
 *   - A selectable "all" option for filters (e.g. lists).
 *
 * Usage (filter, selectable empty option):
 * ```html
 * <tp-interface-select
 *   [(ngModel)]="filterInterfaceName"
 *   name="filterInterface"
 *   [placeholderSelectable]="true"
 *   placeholderKey="interfaces.interfaceList.filters.allInterfaces"
 *   ariaLabelKey="interfaces.interfaceList.fields.interfaceName"
 *   testId="interface-list-filter-interface">
 * </tp-interface-select>
 * ```
 */
@Component({
  selector: 'tp-interface-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './interface-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TpInterfaceSelectComponent),
      multi: true,
    },
  ],
})
export class TpInterfaceSelectComponent implements ControlValueAccessor, OnInit {
  private readonly interfaceService = inject(InterfaceService);

  // ─── Inputs ────────────────────────────────────────────────

  /** Translation key for the empty/placeholder option. */
  @Input() placeholderKey = '';

  /**
   * Whether the empty/placeholder option is selectable.
   * `true` for filters ("All interfaces"), `false` for required selects.
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

  /** `name` attribute for the inner select (needed inside template-driven forms). */
  @Input() name = 'interfaceName';

  /** Accessibility label translation key. */
  @Input() ariaLabelKey = '';

  /** data-testid for the inner select. */
  @Input() testId = 'interface-select';

  // ─── Internal State ────────────────────────────────────────

  /** Available interfaces loaded from the backend. */
  readonly interfaces = signal<InterfaceConfig[]>([]);

  /** Currently selected interface name (form model value), or '' when none. */
  readonly selected = signal<string>('');

  /** Whether the component is disabled. */
  readonly disabled = signal(false);

  /** Whether the user has interacted with the select. */
  readonly touched = signal(false);

  /** Whether the required selection is invalid. */
  readonly isInvalid = computed(() => this.required && this.selected() === '' && this.touched());

  // ─── CVA Callbacks ─────────────────────────────────────────

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadInterfaces();
  }

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

  // ─── Private ───────────────────────────────────────────────

  private loadInterfaces(): void {
    this.interfaceService.findAllConfigurations().subscribe({
      next: (interfaces) => this.interfaces.set(interfaces),
      error: () => {},
    });
  }
}
