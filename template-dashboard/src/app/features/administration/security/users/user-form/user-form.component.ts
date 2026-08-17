import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { TpSelectedReportsComponent } from '../../../../../shared/components/selected-reports';
import { UserDTO, ProfileRef } from '../../../../../core/models/user.model';

type FormMode = 'create' | 'edit';

/**
 * User form component.
 * Handles creation and edition of a user.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TpSelectedReportsComponent],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  /** The mode of the form: 'create' or 'edit'. */
  readonly mode = input.required<FormMode>();

  /** The initial user data to populate the form. */
  readonly user = input.required<UserDTO>();

  /** Available profiles for the select dropdown. */
  readonly profiles = input.required<ProfileRef[]>();

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<UserDTO>();

  /** Emitted when the user clicks cancel. */
  readonly cancel = output<void>();

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
    this.formUser.update(u => ({ ...u, [field]: value }));
  }

  onSubmit(): void {
    this.save.emit(this.formUser());
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
