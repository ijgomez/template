import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { Profile } from '../models/profile.model';

/**
 * Profile detail component.
 * Displays the read-only detail view for a single profile,
 * including its assigned actions.
 */
@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe],
  templateUrl: './profile-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDetailComponent {
  /** The profile to display. */
  readonly profile = input.required<Profile>();

  /** Whether the current user has write permissions. */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Emitted when the user clicks the edit button. */
  readonly edit = output<Profile>();

  /** Emitted when the user clicks the delete button. */
  readonly delete = output<Profile>();

  onBack(): void {
    this.back.emit();
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
