import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { InterfaceService } from '../../../core/services/interface.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import {
  InterfaceConfig,
  InterfaceLog,
  InterfaceLogCriteria,
  InterfaceOperationType,
  InterfaceLogStatus,
} from '../../../core/models/interface.model';

/**
 * Interface monitor component.
 * Displays a paginated, filterable table of interface operation logs (read-only per Req 25.12).
 * Supports detail view and CSV export.
 */
@Component({
  selector: 'app-interfaces-monitor',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './monitor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorComponent implements OnInit {
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<'list' | 'detail'>('list');
  readonly selectedLog = signal<InterfaceLog | null>(null);

  // Pagination state
  readonly logs = signal<InterfaceLog[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));
  readonly isLoading = signal(false);

  // Filter state
  readonly filterDateFrom = signal('');
  readonly filterDateTo = signal('');
  readonly filterOperationType = signal('');
  readonly filterInterfaceId = signal('');
  readonly filterStatus = signal('');

  // Available interfaces for filter dropdown
  readonly availableInterfaces = signal<InterfaceConfig[]>([]);

  // Filter dropdown options
  readonly operationTypes: InterfaceOperationType[] = ['IN', 'OUT'];
  readonly logStatuses: InterfaceLogStatus[] = ['SUCCESS', 'ERROR'];

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Page size options for the selector
  readonly pageSizeOptions = [5, 10, 20, 50];

  ngOnInit(): void {
    this.loadAvailableInterfaces();
    this.loadLogs();
  }

  /**
   * Loads available interface configurations for the filter dropdown.
   */
  loadAvailableInterfaces(): void {
    this.interfaceService.findAllConfigurations().subscribe({
      next: (configs) => this.availableInterfaces.set(configs),
    });
  }

  /**
   * Loads interface logs from the backend with current pagination and filters.
   */
  loadLogs(): void {
    this.isLoading.set(true);
    const criteria = this.buildCriteria();
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.interfaceService.findLogsByCriteria(criteria, this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.logs.set(page.content);
        this.totalElements.set(page.totalElements);
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
   * Applies filters and reloads the data from page 0.
   */
  applyFilters(): void {
    this.currentPage.set(0);
    this.loadLogs();
  }

  /**
   * Clears all filters and reloads.
   */
  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterOperationType.set('');
    this.filterInterfaceId.set('');
    this.filterStatus.set('');
    this.currentPage.set(0);
    this.loadLogs();
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs();
    }
  }

  /**
   * Opens the detail view for a log entry.
   */
  viewDetail(log: InterfaceLog): void {
    this.selectedLog.set(log);
    this.viewMode.set('detail');
  }

  /**
   * Selects a row in the table (for toolbar actions).
   */
  selectRow(log: InterfaceLog): void {
    if (this.selectedLog()?.id === log.id) {
      this.selectedLog.set(null);
    } else {
      this.selectedLog.set(log);
    }
  }

  /**
   * Changes the page size and reloads from page 0.
   */
  changePageSize(size: number | string): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
    this.loadLogs();
  }

  /**
   * Returns to the list view.
   */
  backToList(): void {
    this.viewMode.set('list');
    this.selectedLog.set(null);
  }

  /**
   * Exports current page data to CSV.
   */
  exportCsv(): void {
    const progressId = this.notificationService.showProgress('notification.export.progress');

    try {
      const headers = [
        this.translateService.instant('interfaces.monitor.fields.timestamp'),
        this.translateService.instant('interfaces.monitor.fields.operationType'),
        this.translateService.instant('interfaces.monitor.fields.interfaceName'),
        this.translateService.instant('interfaces.monitor.fields.status'),
        this.translateService.instant('interfaces.monitor.fields.requestPayload'),
        this.translateService.instant('interfaces.monitor.fields.responsePayload'),
        this.translateService.instant('interfaces.monitor.fields.errorMessage'),
      ];

      const rows = this.logs().map((log) => [
        this.escapeCsvField(log.timestamp),
        this.escapeCsvField(log.operationType),
        this.escapeCsvField(log.interfaceName),
        this.escapeCsvField(log.status),
        this.escapeCsvField(log.requestPayload ?? ''),
        this.escapeCsvField(log.responsePayload ?? ''),
        this.escapeCsvField(log.errorMessage ?? ''),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interfaces_monitor_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      this.notificationService.updateToSuccess(progressId, 'notification.export.success');
    } catch {
      this.notificationService.updateToError(progressId, 'notification.export.error');
    }
  }

  /**
   * Returns an array of page numbers for pagination display.
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  private buildCriteria(): InterfaceLogCriteria {
    const criteria: InterfaceLogCriteria = {};
    if (this.filterDateFrom()) criteria.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) criteria.dateTo = this.filterDateTo();
    if (this.filterOperationType()) criteria.operationType = this.filterOperationType() as InterfaceOperationType;
    if (this.filterInterfaceId()) criteria.interfaceId = Number(this.filterInterfaceId());
    if (this.filterStatus()) criteria.status = this.filterStatus() as InterfaceLogStatus;
    return criteria;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
