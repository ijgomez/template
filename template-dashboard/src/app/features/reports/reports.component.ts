import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LocalDatePipe } from '../../shared/pipes/local-date.pipe';
import { Report, ReportFilter, ReportResult, ExportFormat } from '../../core/models/report.model';

type ViewMode = 'list' | 'execute';

/**
 * Reports component.
 * Displays the user's assigned reports, allows execution with dynamic filters,
 * paginated results, and multi-format export (PDF, XLSX, CSV, TXT).
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // View state
  readonly viewMode = signal<ViewMode>('list');
  readonly isLoadingReports = signal(false);

  // Reports list
  readonly reports = signal<Report[]>([]);

  // Execution state
  readonly selectedReport = signal<Report | null>(null);
  readonly filters = signal<ReportFilter[]>([]);
  readonly filterValues = signal<Record<string, string>>({});
  readonly isLoadingFilters = signal(false);
  readonly isExecuting = signal(false);
  readonly hasExecuted = signal(false);

  // Results state
  readonly result = signal<ReportResult | null>(null);
  readonly resultPage = signal(0);
  readonly resultSize = signal(10);
  readonly resultTotalPages = computed(() => {
    const r = this.result();
    return r ? r.totalPages : 0;
  });
  readonly resultTotalElements = computed(() => {
    const r = this.result();
    return r ? r.totalElements : 0;
  });

  // Pagination display
  readonly showingFrom = computed(() => this.resultTotalElements() === 0 ? 0 : this.resultPage() * this.resultSize() + 1);
  readonly showingTo = computed(() => Math.min((this.resultPage() + 1) * this.resultSize(), this.resultTotalElements()));

  // Export formats
  readonly exportFormats: ExportFormat[] = ['PDF', 'XLSX', 'CSV', 'TXT'];

  ngOnInit(): void {
    this.loadReports();
  }

  // ─── List View ─────────────────────────────────────────────

  loadReports(): void {
    this.isLoadingReports.set(true);
    this.reportService.findUserReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.isLoadingReports.set(false);
      },
      error: () => {
        this.isLoadingReports.set(false);
        this.notificationService.showError('notification.error');
      },
    });
  }

  // ─── Execute View ──────────────────────────────────────────

  openExecution(report: Report): void {
    this.selectedReport.set(report);
    this.hasExecuted.set(false);
    this.result.set(null);
    this.resultPage.set(0);
    this.filterValues.set({});
    this.viewMode.set('execute');
    this.loadFilters(report.id);
  }

  backToList(): void {
    this.viewMode.set('list');
    this.selectedReport.set(null);
    this.filters.set([]);
    this.filterValues.set({});
    this.result.set(null);
    this.hasExecuted.set(false);
  }

  /**
   * Loads filter definitions for the selected report.
   */
  private loadFilters(reportId: number): void {
    this.isLoadingFilters.set(true);
    this.reportService.getFilters(reportId).subscribe({
      next: (filters) => {
        this.filters.set(filters);
        const values: Record<string, string> = {};
        for (const f of filters) {
          values[f.name] = '';
        }
        this.filterValues.set(values);
        this.isLoadingFilters.set(false);
      },
      error: () => {
        this.isLoadingFilters.set(false);
        this.notificationService.showError('notification.error');
      },
    });
  }

  /**
   * Updates a filter value.
   */
  updateFilterValue(name: string, value: string): void {
    this.filterValues.update((v) => ({ ...v, [name]: value }));
  }

  /**
   * Executes the report with current filter values.
   */
  executeReport(): void {
    const report = this.selectedReport();
    if (!report) return;

    // Validate mandatory filters
    const missingRequired = this.filters()
      .filter((f) => f.required && !this.filterValues()[f.name]);
    if (missingRequired.length > 0) {
      return;
    }

    this.isExecuting.set(true);
    const progressId = this.notificationService.showProgress('notification.progress');

    this.reportService.execute(report.id, this.filterValues(), this.resultPage(), this.resultSize()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.hasExecuted.set(true);
        this.isExecuting.set(false);
        this.notificationService.dismiss(progressId);
      },
      error: () => {
        this.isExecuting.set(false);
        this.notificationService.updateToError(progressId, 'notification.error');
      },
    });
  }

  /**
   * Navigates to a result page.
   */
  goToResultPage(page: number): void {
    if (page >= 0 && page < this.resultTotalPages()) {
      this.resultPage.set(page);
      this.executeReport();
    }
  }

  /**
   * Exports the report in the given format.
   */
  exportReport(format: ExportFormat): void {
    const report = this.selectedReport();
    if (!report) return;

    const progressId = this.notificationService.showProgress('notification.export.progress');

    this.reportService.export(report.id, this.filterValues(), format).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.name}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
        link.click();
        URL.revokeObjectURL(url);
        this.notificationService.updateToSuccess(progressId, 'notification.export.success');
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.export.error');
      },
    });
  }

  /**
   * Returns page numbers for pagination display.
   */
  getPageNumbers(): number[] {
    const total = this.resultTotalPages();
    const current = this.resultPage();
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
}
