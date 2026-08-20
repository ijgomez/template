import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { Action } from '../models/action.model';

/**
 * Action form component.
 * Handles edition of an action (no create per Req 25.11).
 */
@Component({
  selector: 'app-action-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './action-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionFormComponent implements OnInit {
  /** The initial action data to populate the form. */
  readonly action = input.required<Action>();

  /** Whether a save operation is in progress. */
  readonly saving = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<Partial<Action>>();

  /** Emitted when the user clicks cancel. */
  readonly cancel = output<void>();

  // Internal form state
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editType = signal('');

  // Action types for dropdown
  readonly actionTypes = ['READ', 'WRITE', 'EXECUTE'];

  ngOnInit(): void {
    const action = this.action();
    this.editName.set(action.name);
    this.editDescription.set(action.description ?? '');
    this.editType.set(action.type);
  }

  onSubmit(): void {
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
}
