import { Component, ChangeDetectionStrategy, computed, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { TpSelectedActionsComponent } from '../../../../../shared/components/selected-actions';
import { Profile } from '../models/profile.model';

type FormMode = 'create' | 'edit' | 'view';

/**
 * Profile form component.
 * Handles creation, edition, and read-only viewing of a profile.
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpSelectedActionsComponent],
  templateUrl: './profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent implements OnInit {
  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial profile data to populate the form. */
  readonly profile = input.required<Profile>();

  /** The initial action IDs assigned to the profile. */
  readonly actionIds = input.required<number[]>();

  /** Whether the current user has write permissions (used in view mode). */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the form is submitted with valid data. */
  readonly save = output<{ profile: Profile; actionIds: number[] }>();

  /** Emitted when the user clicks cancel or back. */
  readonly cancel = output<void>();

  /** Emitted when the user clicks the edit button (view mode). */
  readonly edit = output<Profile>();

  /** Emitted when the user clicks the delete button (view mode). */
  readonly delete = output<Profile>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  // Internal form state
  readonly formProfile = signal<Profile>({ id: null, name: '', description: '', actions: [] });
  readonly selectedActionIds = signal<number[]>([]);

  ngOnInit(): void {
    this.formProfile.set({ ...this.profile() });
    this.selectedActionIds.set([...this.actionIds()]);
  }

  updateField(field: keyof Profile, value: unknown): void {
    if (this.isReadonly()) return;
    this.formProfile.update(p => ({ ...p, [field]: value }));
  }

  onSubmit(): void {
    if (this.isReadonly()) return;
    this.save.emit({
      profile: this.formProfile(),
      actionIds: this.selectedActionIds(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onEdit(): void {
    this.edit.emit(this.profile());
  }

  onDelete(): void {
    this.delete.emit(this.profile());
  }

  getActionTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'READ':
        return 'bg-info-subtle text-info';
      case 'WRITE':
        return 'bg-warning-subtle text-warning';
      case 'DELETE':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }
}
