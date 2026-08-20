import { Component, ChangeDetectionStrategy, computed, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { TpSelectedReportsComponent } from '../../../../../shared/components/selected-reports';
import { UserDTO, ProfileRef } from '../../../../../core/models/user.model';

type FormMode = 'create' | 'edit' | 'view';

/**
 * User form component.
 * Handles creation, edition, and read-only viewing of a user.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpSelectedReportsComponent],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial user data to populate the form. */
  readonly user = input.required<UserDTO>();

  /** Available profiles for the select dropdown. */
  readonly profiles = input.required<ProfileRef[]>();

  /** Whether the current user has write permissions (used in view mode). */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<UserDTO>();

  /** Emitted when the user clicks cancel or back. */
  readonly cancel = output<void>();

  /** Emitted when the user clicks the edit button (view mode). */
  readonly edit = output<UserDTO>();

  /** Emitted when the user clicks the delete button (view mode). */
  readonly delete = output<UserDTO>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  // Internal form state
  readonly formUser = signal<UserDTO>({
    id: null,
    username: '',
    password: '',
    firstName: null,
    lastName: null,
    email: null,
    profileId: null,
    reportIds: [],
    lastAccess: null,
    createdAt: null,
    lastModifiedAt: null,
  });

  ngOnInit(): void {
    this.formUser.set({ ...this.user() });
  }

  updateField(field: keyof UserDTO, value: unknown): void {
    if (this.isReadonly()) return;
    this.formUser.update(u => ({ ...u, [field]: value }));
  }

  onSubmit(): void {
    if (this.isReadonly()) return;
    this.save.emit(this.formUser());
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onEdit(): void {
    this.edit.emit(this.user());
  }

  onDelete(): void {
    this.delete.emit(this.user());
  }
}
