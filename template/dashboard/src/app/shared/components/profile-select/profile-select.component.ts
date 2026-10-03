import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { UserService } from '../../../core/services/user.service';
import { ProfileRef } from '../../../core/models/user.model';

/**
 * Reusable ControlValueAccessor component that renders a profile selector.
 *
 * - Loads the available profiles on its own via {@link UserService.getProfiles}.
 * - Writes the selected profile ID (`number | null`) as the form value.
 * - Supports two placeholder styles through inputs:
 *   - A disabled placeholder for required selects (e.g. forms).
 *   - A selectable "all" option for filters (e.g. lists).
 *
 * Usage (form, required):
 * ```html
 * <tp-profile-select
 *   formControlName="profileId"
 *   [placeholderKey]="'users.form.selectProfile'"
 *   [required]="true">
 * </tp-profile-select>
 * ```
 *
 * Usage (filter, selectable empty option):
 * ```html
 * <tp-profile-select
 *   [(ngModel)]="filterProfileId"
 *   [placeholderKey]="'users.filters.allProfiles'"
 *   [placeholderSelectable]="true">
 * </tp-profile-select>
 * ```
 */
@Component({
  selector: 'tp-profile-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './profile-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TpProfileSelectComponent),
      multi: true,
    },
  ],
})
export class TpProfileSelectComponent implements ControlValueAccessor, OnInit {
  private readonly userService = inject(UserService);

  // ─── Inputs ────────────────────────────────────────────────

  /** Translation key for the empty/placeholder option. */
  @Input() placeholderKey = '';

  /**
   * Whether the empty/placeholder option is selectable.
   * `true` for filters ("All profiles"), `false` for required selects.
   */
  @Input() placeholderSelectable = false;

  /** Whether the select is required (adds the `required` attribute). */
  @Input() required = false;

  /** `name` attribute for the inner select (needed inside template-driven forms). */
  @Input() name = 'profileId';

  /** Accessibility label translation key. */
  @Input() ariaLabelKey = '';

  /** data-testid for the inner select. */
  @Input() testId = 'profile-select';

  // ─── Internal State ────────────────────────────────────────

  /** Available profiles loaded from the backend. */
  readonly profiles = signal<ProfileRef[]>([]);

  /** Currently selected profile ID (form model value). */
  readonly selectedId = signal<number | null>(null);

  /** Whether the component is disabled. */
  readonly disabled = signal(false);

  // ─── CVA Callbacks ─────────────────────────────────────────

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadProfiles();
  }

  // ─── ControlValueAccessor ──────────────────────────────────

  writeValue(value: number | null): void {
    this.selectedId.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
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
  onSelectionChange(value: number | null): void {
    this.selectedId.set(value);
    this.onChange(value);
    this.onTouched();
  }

  // ─── Private ───────────────────────────────────────────────

  private loadProfiles(): void {
    this.userService.getProfiles().subscribe({
      next: (profiles) => this.profiles.set(profiles),
      error: () => {},
    });
  }
}
