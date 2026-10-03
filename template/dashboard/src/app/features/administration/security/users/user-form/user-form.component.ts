import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { TpReportSelectedListComponent } from '../../../../reports/components/report-selected-list';
import { TpProfileSelectComponent } from '../../../../../shared/components/profile-select';
import { UserDTO } from '../../../../../core/models/user.model';

type FormMode = 'create' | 'edit' | 'view';

/**
 * User form component.
 * Handles creation, edition, and read-only viewing of a user.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpReportSelectedListComponent, TpProfileSelectComponent],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial user data to populate the form. */
  readonly user = input.required<UserDTO>();

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

  /** Whether the email value is present but malformed. */
  readonly emailIsInvalid = computed(() => {
    const email = this.formUser().email?.trim() ?? '';
    return email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  /** Whether the form is invalid for save in create/edit modes. */
  readonly isSaveDisabled = computed(() => {
    if (this.isReadonly()) {
      return true;
    }

    const user = this.formUser();
    const username = user.username?.trim() ?? '';
    const password = user.password?.trim() ?? '';
    const profileId = user.profileId;

    return !username || (this.mode() === 'create' && !password) || !profileId || this.emailIsInvalid();
  });

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

  constructor() {
    effect(() => {
      this.formUser.set({ ...this.user() });
    });
  }

  updateField(field: keyof UserDTO, value: unknown): void {
    if (this.isReadonly()) return;
    this.formUser.update(u => ({ ...u, [field]: value }));
  }

  onSubmit(): void {
    if (this.isReadonly() || this.isSaveDisabled()) return;
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
