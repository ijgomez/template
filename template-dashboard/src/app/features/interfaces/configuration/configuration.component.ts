import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { InterfaceService } from '../../../core/services/interface.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { InterfaceConfig } from '../../../core/models/interface.model';

/**
 * Interface configuration component.
 * Displays all interface configurations with status indicators (read-only per Req 25.12).
 * Supports detail view.
 */
@Component({
  selector: 'app-interfaces-configuration',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit {
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // View state
  readonly viewMode = signal<'list' | 'detail'>('list');
  readonly selectedConfig = signal<InterfaceConfig | null>(null);

  // Data state
  readonly configurations = signal<InterfaceConfig[]>([]);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.loadConfigurations();
  }

  /**
   * Loads all interface configurations from the backend.
   */
  loadConfigurations(): void {
    this.isLoading.set(true);
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.interfaceService.findAllConfigurations().subscribe({
      next: (configs) => {
        this.configurations.set(configs);
        this.isLoading.set(false);
        this.notificationService.dismiss(progressId);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.updateToError(progressId, 'notification.error');
      },
    });
  }

  /**
   * Opens the detail view for a configuration.
   */
  viewDetail(config: InterfaceConfig): void {
    this.selectedConfig.set(config);
    this.viewMode.set('detail');
  }

  /**
   * Returns to the list view.
   */
  backToList(): void {
    this.viewMode.set('list');
    this.selectedConfig.set(null);
  }
}
