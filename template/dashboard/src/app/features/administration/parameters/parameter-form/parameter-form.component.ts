import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal, OnInit, inject } from '@angular/core';
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
  readonly cancel = output<void>();

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
    if (this.isReadonly() || this.isSaveDisabled()) return;
    if (!this.validateTypeValue()) return;
    this.save.emit(this.formData());
  }

  onCancel(): void {
    this.cancel.emit();
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
