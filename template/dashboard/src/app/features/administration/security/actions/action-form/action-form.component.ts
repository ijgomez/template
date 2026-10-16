import { Component, ChangeDetectionStrategy, computed, effect, ElementRef, input, output, signal, viewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { Action } from '../models/action.model';

type FormMode = 'edit' | 'view';

/**
 * Action form component.
 * Handles edition and read-only viewing of an action.
 * No create mode per Req 25.11.
 */
@Component({
  selector: 'app-action-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './action-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionFormComponent implements OnInit {
  /** The mode of the form: 'edit' or 'view'. */
  readonly mode = input<FormMode>('edit');

  /** The initial action data to populate the form. */
  readonly action = input.required<Action>();

  /** Whether a save operation is in progress. */
  readonly saving = input<boolean>(false);

  /** Whether the current user has edit permissions (used in view mode). */
  readonly canEdit = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<Partial<Action>>();

  /** Emitted when the user clicks cancel or back. */
  readonly cancel = output<void>();

  /** Emitted when the user clicks the edit button (view mode). */
  readonly edit = output<Action>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  // Internal form state
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editType = signal('');

  // Action types for dropdown
  readonly actionTypes = ['READ', 'WRITE', 'EXECUTE'];

  /** Whether a save was attempted while the form was invalid (controls the error summary). */
  readonly submitAttempted = signal(false);

  /** Reference to the error summary container, used to move focus after a failed submit. */
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  /**
   * List of validation errors for the error summary.
   * Each entry links to the invalid field via its DOM id. Only computed in edit mode.
   */
  readonly formErrors = computed<ReadonlyArray<{ fieldId: string; messageKey: string }>>(() => {
    if (this.isReadonly()) {
      return [];
    }

    const errors: { fieldId: string; messageKey: string }[] = [];
    if (!(this.editName()?.trim())) {
      errors.push({ fieldId: 'actionName', messageKey: 'actions.errors.nameRequired' });
    }
    if (!(this.editType()?.trim())) {
      errors.push({ fieldId: 'actionType', messageKey: 'actions.errors.typeRequired' });
    }
    return errors;
  });

  constructor() {
    // Move focus to the error summary after a failed submit.
    effect(() => {
      if (this.submitAttempted() && this.formErrors().length > 0) {
        this.errorSummary()?.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    const action = this.action();
    this.editName.set(action.name);
    this.editDescription.set(action.description ?? '');
    this.editType.set(action.type);
  }

  onSubmit(): void {
    if (this.isReadonly()) return;

    if (this.formErrors().length > 0) {
      this.submitAttempted.set(true);
      return;
    }

    this.submitAttempted.set(false);
    const action = this.action();
    this.save.emit({
      id: action.id,
      code: action.code,
      name: this.editName(),
      description: this.editDescription() || null,
      type: this.editType(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onEdit(): void {
    this.edit.emit(this.action());
  }
}
