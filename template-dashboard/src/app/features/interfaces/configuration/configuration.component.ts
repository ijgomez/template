import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { InterfaceService } from '../../../core/services/interface.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../shared/components/data-table';
import { InterfaceConfig } from '../../../core/models/interface.model';

/**
 * Interface configuration component.
 * Displays all interface configurations with status indicators (read-only per Req 25.12).
 * Client-side filtering and pagination for consistency with standard listing mockup pattern.
 * Supports row selection and detail view.
 */
@Component({
  selector: 'app-interfaces-configuration',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit {
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<'list' | 'detail'>('list');
  readonly selectedConfig = signal<InterfaceConfig | null>(null);

  // Data state
  readonly configurations = signal<InterfaceConfig[]>([]);
  readonly isLoading = signal(false);

  // Selection
  readonly selectedRow = signal<InterfaceConfig | null>(null);

  // Sort state
  readonly sortColumn = signal('');
  readonly sortDirection = signal('');

  // Filters
  readonly filterName = signal('');
  readonly filterProtocol = signal('');
  readonly filterStatus = signal('');

  // Pagination
  readonly pageSizes = [5, 10, 20, 50];
  readonly pageSize = signal(10);
  readonly currentPage = signal(0);

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'name', header: 'interfaces.configuration.fields.name', sortable: true, resizable: true, reorderable: true },
    { key: 'protocol', header: 'interfaces.configuration.fields.protocol', sortable: true, resizable: true, reorderable: true },
    { key: 'url', header: 'interfaces.configuration.fields.url' },
    { key: 'status', header: 'interfaces.configuration.fields.status', sortable: true, resizable: true, reorderable: true },
    { key: 'checkFrequency', header: 'interfaces.configuration.fields.checkFrequency', sortable: true, resizable: true, reorderable: true },
    { key: 'lastModifiedAt', header: 'interfaces.configuration.fields.lastModifiedAt', sortable: true, resizable: true, reorderable: true },
  ];

  // Computed: filtered configurations
  readonly filteredConfigs = computed(() => {
    let configs = this.configurations();
    const name = this.filterName().trim().toLowerCase();
    const protocol = this.filterProtocol();
    const status = this.filterStatus();

    if (name) {
      configs = configs.filter((c) => c.name.toLowerCase().includes(name));
    }
    if (protocol) {
      configs = configs.filter((c) => c.protocol === protocol);
    }
    if (status) {
      configs = configs.filter((c) => c.status === status);
    }

    // Apply sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col && dir) {
      configs = [...configs].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[col];
        const bVal = (b as unknown as Record<string, unknown>)[col];
        const comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? comparison : -comparison;
      });
    }

    return configs;
  });

  // Computed: pagination metadata
  readonly totalElements = computed(() => this.filteredConfigs().length);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);
  readonly paginatedConfigs = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredConfigs().slice(start, start + this.pageSize());
  });
  readonly showingFrom = computed(() => (this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1));
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

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
   * Selects or deselects a row in the table.
   */
  selectRow(config: InterfaceConfig): void {
    this.selectedRow.set(this.selectedRow()?.id === config.id ? null : config);
  }

  /**
   * Applies filters and resets pagination.
   */
  applyFilters(): void {
    this.currentPage.set(0);
    this.selectedRow.set(null);
  }

  /**
   * Clears all filters and resets pagination.
   */
  clearFilters(): void {
    this.filterName.set('');
    this.filterProtocol.set('');
    this.filterStatus.set('');
    this.currentPage.set(0);
    this.selectedRow.set(null);
  }

  /**
   * Handles sort events from the data table.
   */
  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(0);
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Changes the page size and resets to page 0.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
  }

  /**
   * Opens the detail view for the currently selected row.
   */
  viewSelectedDetail(): void {
    const config = this.selectedRow();
    if (config) {
      this.viewDetail(config);
    }
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

  /**
   * Exports the current filtered data as CSV.
   */
  exportCsv(): void {
    const configs = this.filteredConfigs();
    if (configs.length === 0) {
      return;
    }

    const headers = [
      this.translateService.instant('interfaces.configuration.fields.name'),
      this.translateService.instant('interfaces.configuration.fields.protocol'),
      this.translateService.instant('interfaces.configuration.fields.url'),
      this.translateService.instant('interfaces.configuration.fields.status'),
      this.translateService.instant('interfaces.configuration.fields.checkFrequency'),
      this.translateService.instant('interfaces.configuration.fields.lastModifiedAt'),
    ];

    const rows = configs.map((c) => [
      c.name,
      c.protocol,
      c.url,
      c.status,
      c.checkFrequency,
      c.lastModifiedAt,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interface-configurations.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
