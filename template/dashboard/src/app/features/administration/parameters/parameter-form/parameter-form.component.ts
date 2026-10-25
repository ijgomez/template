import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, effect, ElementRef, input, output, signal, viewChild, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { Parameter, ParameterType } from '../../../../core/models/parameter.model';
import { ParameterService } from '../../../../core/services/parameter.service';

type FormMode = 'create' | 'edit' | 'view';

/**
 * Parameter form component.
 * Handles creation, edition, and read-only viewing of a parameter.
 */
@Component({
  selector: 'app-parameter-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './parameter-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterFormComponent implements OnInit {
  private readonly translateService = inject(TranslateService);
  private readonly parameterService = inject(ParameterService);

  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial parameter data to populate the form. */
  readonly parameter = input.required<Parameter>();

  /** Whether the current user has write permissions (used in view mode). */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<Parameter>();

  /** Emitted when the user clicks cancel or back. */
  readonly cancelled = output<void>();

  /** Emitted when the user clicks the edit button (view mode). */
  readonly edit = output<Parameter>();

  /** Emitted when the user clicks the delete button (view mode). */
  readonly delete = output<Parameter>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  /** Whether the form is invalid for save in create/edit modes. */
  readonly isSaveDisabled = computed(() => {
    if (this.isReadonly()) {
      return true;
    }

    const data = this.formData();
    const code = data.code?.trim() ?? '';
    return !code || this.codeExistsError() !== '' || this.typeValueError() !== '';
  });

  /** Whether a save was attempted while the form was invalid (controls the error summary). */
  readonly submitAttempted = signal(false);

  /** Reference to the error summary container, used to move focus after a failed submit. */
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  /**
   * List of validation errors for the error summary.
   * Entries carry either a translation key (`messageKey`) or an already resolved
   * message (`message`, for business rules such as duplicate code / type mismatch).
   */
  readonly formErrors = computed<ReadonlyArray<{ fieldId: string; messageKey?: string; message?: string }>>(() => {
    if (this.isReadonly()) {
      return [];
    }

    const data = this.formData();
    const errors: { fieldId: string; messageKey?: string; message?: string }[] = [];

    if (!(data.code?.trim())) {
      errors.push({ fieldId: 'paramCode', messageKey: 'parameters.errors.codeRequired' });
    } else if (this.codeExistsError()) {
      errors.push({ fieldId: 'paramCode', message: this.codeExistsError() });
    }
    if (!(data.value?.trim())) {
      errors.push({ fieldId: 'paramValue', messageKey: 'parameters.errors.valueRequired' });
    } else if (this.typeValueError()) {
      errors.push({ fieldId: 'paramValue', message: this.typeValueError() });
    }

    return errors;
  });

  // Internal form state
  readonly formData = signal<Parameter>({
    id: null,
    code: '',
    description: '',
    value: '',
    type: 'STRING',
    createdAt: null,
    lastModifiedAt: null,
  });

  // Validation
  readonly typeValueError = signal('');
  readonly codeExistsError = signal('');

  // Available types for dropdown
  readonly parameterTypes: ParameterType[] = ['STRING', 'INTEGER', 'BOOLEAN', 'DATE'];

  constructor() {
    effect(() => {
      const parameter = this.parameter();
      const next = { ...parameter };
      this.formData.set(next);
      this.typeValueError.set(this.getTypeValueValidationError(next.type, next.value));
      this.validateCodeUniqueness(next.code ?? '');
    });

    // Move focus to the error summary after a failed submit.
    effect(() => {
      if (this.submitAttempted() && this.formErrors().length > 0) {
        this.errorSummary()?.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    this.formData.set({ ...this.parameter() });
    this.typeValueError.set(this.getTypeValueValidationError(this.formData().type, this.formData().value));
  }

  updateField(field: keyof Parameter, value: unknown): void {
    if (this.isReadonly()) return;
    this.formData.update((p) => {
      const next = { ...p, [field]: value } as Parameter;
      if (field === 'type' || field === 'value') {
        this.typeValueError.set(this.getTypeValueValidationError(next.type, next.value));
      }
      return next;
    });

    if (field === 'code') {
      this.validateCodeUniqueness((value as string | null | undefined)?.trim() ?? '');
    }
  }

  onSubmit(): void {
    if (this.isReadonly()) return;

    // Re-run the type/value check so the summary reflects the latest state.
    this.validateTypeValue();

    if (this.isSaveDisabled()) {
      this.submitAttempted.set(true);
      return;
    }

    this.submitAttempted.set(false);
    this.save.emit(this.formData());
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onEdit(): void {
    this.edit.emit(this.parameter());
  }

  onDelete(): void {
    this.delete.emit(this.parameter());
  }

  // ─── Validation ─────────────────────────────────────────────

  private validateTypeValue(): boolean {
    const data = this.formData();
    const error = this.getTypeValueValidationError(data.type, data.value);
    this.typeValueError.set(error);
    return error === '';
  }

  private validateCodeUniqueness(code: string): void {
    const trimmedCode = code.trim();
    if (this.isReadonly() || this.mode() === 'edit' || !trimmedCode) {
      this.codeExistsError.set('');
      return;
    }

    this.parameterService.countByCriteria({ code: trimmedCode })
      .pipe(
        catchError(() => of(0)),
        take(1)
      )
      .subscribe((count) => {
        if ((this.formData().code ?? '').trim() !== trimmedCode) {
          return;
        }

        if (count === 0) {
          this.codeExistsError.set('');
          return;
        }

        const messageKey = 'parameters.validation.codeExists';
        const translated = this.translateService.instant(messageKey);
        const fallback = 'Code already exists in the database';

        this.codeExistsError.set(translated && translated !== messageKey ? translated : fallback);
      });
  }

  private getTypeValueValidationError(type: ParameterType, value: string): string {
    if (!value) return '';

    switch (type) {
      case 'INTEGER':
        if (!/^-?\d+$/.test(value)) {
          return this.translateService.instant('parameters.validation.integer');
        }
        break;
      case 'BOOLEAN':
        if (value !== 'true' && value !== 'false') {
          return this.translateService.instant('parameters.validation.boolean');
        }
        break;
      case 'DATE':
        if (!this.isValidIso8601(value)) {
          return this.translateService.instant('parameters.validation.date');
        }
        break;
      case 'STRING':
        break;
    }
    return '';
  }

  private isValidIso8601(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value);
  }
}
