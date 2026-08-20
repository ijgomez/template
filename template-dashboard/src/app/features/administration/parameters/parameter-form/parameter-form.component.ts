import { Component, ChangeDetectionStrategy, computed, input, output, signal, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { Parameter, ParameterType } from '../../../../core/models/parameter.model';

type FormMode = 'create' | 'edit' | 'view';

/**
 * Parameter form component.
 * Handles creation, edition, and read-only viewing of a parameter.
 */
@Component({
  selector: 'app-parameter-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './parameter-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterFormComponent implements OnInit {
  private readonly translateService = inject(TranslateService);

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

  // Available types for dropdown
  readonly parameterTypes: ParameterType[] = ['STRING', 'INTEGER', 'BOOLEAN', 'DATE'];

  ngOnInit(): void {
    this.formData.set({ ...this.parameter() });
  }

  updateField(field: keyof Parameter, value: unknown): void {
    if (this.isReadonly()) return;
    this.formData.update(p => ({ ...p, [field]: value }));
    if (field === 'type' || field === 'value') {
      this.validateTypeValue();
    }
  }

  onSubmit(): void {
    if (this.isReadonly()) return;
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
