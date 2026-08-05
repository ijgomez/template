import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { AuditLog, AuditCriteria, OperationType, AuditSection } from '../../../core/models/audit.model';

/**
 * Audit log component.
 * Displays a paginated, filterable table of audit log entries (read-only per Req 25.12).
 * Supports detail view and CSV export.
 */
@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './audit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

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

  // Filter state
  readonly filterDateFrom = signal('');
  readonly filterDateTo = signal('');
  readonly filterUsername = signal('');
  readonly filterOperationType = signal('');
  readonly filterSection = signal('');

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Page size options
  readonly pageSizes = [5, 10, 20, 50];

  // Filter dropdown options
  readonly operationTypes: OperationType[] = ['CREATE', 'UPDATE', 'DELETE', 'EXECUTE'];
  readonly auditSections: AuditSection[] = ['SECURITY', 'REPORTS', 'INTERFACES', 'CLUSTER', 'SYSTEM'];

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

    this.auditService.findByCriteria(criteria, this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.auditLogs.set(page.content);
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
   * Exports current page data to CSV.
   */
  exportCsv(): void {
    const progressId = this.notificationService.showProgress('notification.export.progress');

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

      const rows = this.auditLogs().map((log) => [
        this.escapeCsvField(log.timestamp),
        this.escapeCsvField(log.username),
        this.escapeCsvField(log.operationType),
        this.escapeCsvField(log.section),
        this.escapeCsvField(log.entityId),
        this.escapeCsvField(log.entityName),
        this.escapeCsvField(log.detail),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
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

  private buildCriteria(): AuditCriteria {
    const criteria: AuditCriteria = {};
    if (this.filterDateFrom()) criteria.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) criteria.dateTo = this.filterDateTo();
    if (this.filterUsername()) criteria.username = this.filterUsername();
    if (this.filterOperationType()) criteria.operationType = this.filterOperationType() as OperationType;
    if (this.filterSection()) criteria.section = this.filterSection() as AuditSection;
    return criteria;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
