import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { TpSelectedActionsComponent } from '../../../../../shared/components/selected-actions';
import { Profile } from '../models/profile.model';

type FormMode = 'create' | 'edit';

/**
 * Profile form component.
 * Handles creation and edition of a profile.
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TpSelectedActionsComponent],
  templateUrl: './profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent implements OnInit {
  /** The mode of the form: 'create' or 'edit'. */
  readonly mode = input.required<FormMode>();

  /** The initial profile data to populate the form. */
  readonly profile = input.required<Profile>();

  /** The initial action IDs assigned to the profile. */
  readonly actionIds = input.required<number[]>();

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<{ profile: Profile; actionIds: number[] }>();

  /** Emitted when the user clicks cancel. */
  readonly cancel = output<void>();

  // Internal form state
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly selectedActionIds = signal<number[]>([]);

  ngOnInit(): void {
    this.formProfile.set({ ...this.profile() });
    this.selectedActionIds.set([...this.actionIds()]);
  }

  updateField(field: keyof Profile, value: unknown): void {
    this.formProfile.update(p => ({ ...p, [field]: value }));
  }

  onSubmit(): void {
    this.save.emit({
      profile: this.formProfile(),
      actionIds: this.selectedActionIds(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
