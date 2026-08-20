import { Component, ChangeDetectionStrategy, input, output, signal, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { Parameter, ParameterType } from '../../../../core/models/parameter.model';

type FormMode = 'create' | 'edit';

/**
 * Parameter form component.
 * Handles creation and edition of a parameter with type-value validation.
 */
@Component({
  selector: 'app-parameter-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './parameter-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterFormComponent implements OnInit {
  private readonly translateService = inject(TranslateService);

  /** The mode of the form: 'create' or 'edit'. */
  readonly mode = input.required<FormMode>();

  /** The initial parameter data to populate the form. */
  readonly parameter = input.required<Parameter>();

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<Parameter>();

  /** Emitted when the user clicks cancel. */
  readonly cancel = output<void>();

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
    this.formData.update(p => ({ ...p, [field]: value }));
    if (field === 'type' || field === 'value') {
      this.validateTypeValue();
    }
  }

  onSubmit(): void {
    if (!this.validateTypeValue()) return;
    this.save.emit(this.formData());
  }

  onCancel(): void {
    this.cancel.emit();
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
