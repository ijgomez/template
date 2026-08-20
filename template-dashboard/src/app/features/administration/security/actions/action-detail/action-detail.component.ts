import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../../shared/pipes/local-date.pipe';
import { Action } from '../models/action.model';

/**
 * Action detail component.
 * Displays the read-only detail view for a single action.
 */
@Component({
  selector: 'app-action-detail',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe],
  templateUrl: './action-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionDetailComponent {
  /** The action to display. */
  readonly action = input.required<Action>();

  /** Whether the current user has edit permissions. */
  readonly canEdit = input<boolean>(false);

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Emitted when the user clicks the edit button. */
  readonly edit = output<Action>();

  onBack(): void {
    this.back.emit();
  }

  onEdit(): void {
    this.edit.emit(this.action());
  }
}
