import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuditService } from '../../../../core/services/audit.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DateService } from '../../../../core/services/date.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../../shared/components/data-table';
import { AuditLog, AuditCriteria, OperationType, AuditSection } from '../../../../core/models/audit.model';

/**
 * Audit log component.
 * Displays a paginated, filterable table of audit log entries (read-only per Req 25.12).
 * Supports detail view and CSV export.
 */
@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpDatePickerComponent, TpDataTableComponent, TpColumnDirective],
  templateUrl: './audit-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly dateService = inject(DateService);
  private readonly csvExportService = inject(CsvExportService);

  // View state
  readonly viewMode = signal<'list' | 'detail'>('list');
  readonly selectedAuditLog = signal<AuditLog | null>(null);

  // Pagination state
  readonly auditLogs = signal<AuditLog[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));
  readonly isLoading = signal(false);

  // Sort state
  readonly sortParam = signal('');

  // Filter state
  readonly filterDateFrom = signal('');
  readonly filterDateTo = signal('');
  readonly filterUsername = signal('');
  readonly filterOperationType = signal('');
  readonly filterSection = signal('');

  readonly hasInvalidDateRange = computed(
    () => !!this.filterDateFrom() && !!this.filterDateTo() && this.filterDateFrom() > this.filterDateTo(),
  );

  readonly isFilterDisabled = computed(() => this.isLoading() || this.hasInvalidDateRange());

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Page size options
  readonly pageSizes = [5, 10, 20, 50];

  // Filter dropdown options
  readonly operationTypes: OperationType[] = ['CREATE', 'UPDATE', 'DELETE', 'EXECUTE'];
  readonly auditSections: AuditSection[] = ['SECURITY', 'REPORTS', 'INTERFACES', 'CLUSTER', 'SYSTEM'];

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'timestamp', header: 'audit.fields.timestamp', sortable: true, resizable: true, reorderable: true },
    { key: 'username', header: 'audit.fields.username', sortable: true, resizable: true, reorderable: true },
    { key: 'operationType', header: 'audit.fields.operationType', sortable: true, resizable: true, reorderable: true },
    { key: 'section', header: 'audit.fields.section', sortable: true, resizable: true, reorderable: true },
    { key: 'entityName', header: 'audit.fields.entityName', sortable: true, resizable: true, reorderable: true },
    { key: 'entityId', header: 'audit.fields.entityId' },
    { key: 'detail', header: 'audit.fields.detail' },
  ];

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  /**
   * Loads audit log entries from the backend with current pagination and filters.
   */
  loadAuditLogs(): void {
    this.isLoading.set(true);
    const criteria = this.buildCriteria();
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.auditService.findByCriteria(criteria, this.currentPage(), this.pageSize(), this.sortParam()).subscribe({
      next: (page) => {
        this.auditLogs.set(page.content);
        this.totalElements.set(page.page.totalElements);
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
    if (this.hasInvalidDateRange()) {
      return;
    }

    this.currentPage.set(0);
    this.loadAuditLogs();
  }

  /**
   * Clears all filters and reloads.
   */
  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterUsername.set('');
    this.filterOperationType.set('');
    this.filterSection.set('');
    this.currentPage.set(0);
    this.loadAuditLogs();
  }

  /**
   * Handles sort events from the data table.
   */
  onSort(event: SortEvent): void {
    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
    this.currentPage.set(0);
    this.loadAuditLogs();
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadAuditLogs();
    }
  }

  /**
   * Changes the page size, resets to page 0, and reloads.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadAuditLogs();
  }

  /**
   * Opens the detail view for an audit log entry.
   */
  viewDetail(auditLog: AuditLog): void {
    this.selectedAuditLog.set(auditLog);
    this.viewMode.set('detail');
  }

  /**
   * Returns to the list view.
   */
  backToList(): void {
    this.viewMode.set('list');
    this.selectedAuditLog.set(null);
  }

  /**
   * Exports the full filtered list to CSV, ignoring the current pagination.
   * Fetches all rows matching the active criteria from the backend.
   */
  exportCsv(): void {
    const progressId = this.notificationService.showProgress('notification.export.progress');

    this.auditService.findAllByCriteria(this.buildCriteria(), this.sortParam()).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.notificationService.updateToError(progressId, 'notification.export.empty');
          return;
        }

        try {
          const headers = [
            this.translateService.instant('audit.fields.timestamp'),
            this.translateService.instant('audit.fields.username'),
            this.translateService.instant('audit.fields.operationType'),
            this.translateService.instant('audit.fields.section'),
            this.translateService.instant('audit.fields.entityId'),
            this.translateService.instant('audit.fields.entityName'),
            this.translateService.instant('audit.fields.detail'),
          ];

          const rows = data.map((log) => [
            log.timestamp ? this.dateService.toLocalString(log.timestamp) : '',
            log.username ?? '',
            log.operationType ?? '',
            log.section ?? '',
            String(log.entityId ?? ''),
            log.entityName ?? '',
            log.detail ?? '',
          ]);

          this.csvExportService.export(headers, rows, 'audit');

          this.notificationService.updateToSuccess(progressId, 'notification.export.success');
        } catch {
          this.notificationService.updateToError(progressId, 'notification.export.error');
        }
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.export.error');
      },
    });
  }

  private buildCriteria(): AuditCriteria {
    const criteria: AuditCriteria = {};
    if (this.filterDateFrom()) criteria.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) criteria.dateTo = this.filterDateTo();
    if (this.filterUsername()) criteria.username = this.filterUsername();
    if (this.filterOperationType()) criteria.operationType = this.filterOperationType() as OperationType;
    if (this.filterSection()) criteria.section = this.filterSection() as AuditSection;
    return criteria;
  }
}
