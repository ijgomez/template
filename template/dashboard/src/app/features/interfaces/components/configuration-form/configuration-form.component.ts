import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { InterfaceConfig } from '../../../../core/models/interface.model';

export type FormMode = 'create' | 'edit' | 'view';

/**
 * Interface configuration form component.
 * Reusable form that supports creation, edition, and read-only viewing of an
 * interface configuration. Only the 'view' mode is functional for now; the
 * FormMode structure is kept so the component can be extended later.
 */
@Component({
  selector: 'app-configuration-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './configuration-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationFormComponent {
  /** The mode of the form: 'create', 'edit', or 'view'. */
  readonly mode = input.required<FormMode>();

  /** The initial configuration data to populate the form. */
  readonly config = input<InterfaceConfig | null>();

  /** Emitted when the user clicks back or cancel. */
  readonly cancel = output<void>();

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  /** Whether the form is in readonly mode. */
  readonly isReadonly = computed(() => this.mode() === 'view');

  /** Internal form state, synced from the config input. */
  readonly formConfig = signal<InterfaceConfig | null>(null);

  constructor() {
    effect(() => {
      const config = this.config();
      this.formConfig.set(config ? { ...config } : null);
    });
  }

  onBack(): void {
    this.back.emit();
    this.cancel.emit();
  }
}
