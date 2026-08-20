import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { Parameter } from '../../../../core/models/parameter.model';

/**
 * Parameter detail component.
 * Displays the read-only detail view for a single parameter.
 */
@Component({
  selector: 'app-parameter-detail',
  standalone: true,
  imports: [TranslatePipe, LocalDatePipe],
  templateUrl: './parameter-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterDetailComponent {
  /** The parameter to display. */
  readonly parameter = input.required<Parameter>();

  /** Whether the current user has write permissions. */
  readonly canWrite = input<boolean>(false);

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Emitted when the user clicks the edit button. */
  readonly edit = output<Parameter>();

  /** Emitted when the user clicks the delete button. */
  readonly delete = output<Parameter>();

  onBack(): void {
    this.back.emit();
  }

  onEdit(): void {
    this.edit.emit(this.parameter());
  }

  onDelete(): void {
    this.delete.emit(this.parameter());
  }
}
