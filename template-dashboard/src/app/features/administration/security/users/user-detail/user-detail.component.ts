import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { UserDTO } from '../../../../../core/models/user.model';

/**
 * User detail component.
 * Displays the read-only detail view for a single user.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe],
  templateUrl: './user-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailComponent {
  /** The user to display. */
  readonly user = input.required<UserDTO>();

  /** Whether the current user has write permissions. */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Emitted when the user clicks the edit button. */
  readonly edit = output<UserDTO>();

  /** Emitted when the user clicks the delete button. */
  readonly delete = output<UserDTO>();

  onBack(): void {
    this.back.emit();
  }

  onEdit(): void {
    this.edit.emit(this.user());
  }

  onDelete(): void {
    this.delete.emit(this.user());
  }
}
