import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ReportService } from '../../core/services/report.service';
import { NotificationService } from '../../core/services/notification.service';
import { Report, ReportFilter, ReportResult, ExportFormat } from '../../core/models/report.model';

/**
 * Report execution component.
 * Loaded via /reports/:id — displays the report's dynamic filters and results table.
 * Data is NOT loaded until the user clicks "Ejecutar".
 * Follows the standard list-view pattern: filter bar + export toolbar + paginated table.
 *
 * Requirements: 18.1, 18.4, 18.5, 18.6, 18.7, 19.1
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly notificationService = inject(NotificationService);
  private routeSub?: Subscription;

  // Report metadata
  readonly report = signal<Report | null>(null);
  readonly isLoadingFilters = signal(false);

  // Filters
  readonly filters = signal<ReportFilter[]>([]);
  readonly filterValues = signal<Record<string, string>>({});

  // Execution state
  readonly isExecuting = signal(false);
  readonly hasExecuted = signal(false);

  // Results
  readonly result = signal<ReportResult | null>(null);
  readonly resultPage = signal(0);
  readonly resultSize = signal(10);

  readonly resultTotalPages = computed(() => this.result()?.totalPages ?? 0);
  readonly resultTotalElements = computed(() => this.result()?.totalElements ?? 0);
  readonly showingFrom = computed(() => this.resultTotalElements() === 0 ? 0 : this.resultPage() * this.resultSize() + 1);
  readonly showingTo = computed(() => Math.min((this.resultPage() + 1) * this.resultSize(), this.resultTotalElements()));

  // Export formats
  readonly exportFormats: ExportFormat[] = ['PDF', 'XLSX', 'CSV', 'TXT'];

  // Page size options
  readonly pageSizeOptions = [5, 10, 20, 50];

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const reportId = Number(idParam);
        this.loadReport(reportId);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  /**
   * Loads report metadata and filter definitions for the given report ID.
   */
  private loadReport(reportId: number): void {
    // Reset state when navigating to a different report
    this.hasExecuted.set(false);
    this.result.set(null);
    this.resultPage.set(0);
    this.filterValues.set({});
    this.filters.set([]);
    this.isLoadingFilters.set(true);

    // Load report metadata from user's assigned reports
    this.reportService.findUserReports().subscribe({
      next: (reports) => {
        const found = reports.find((r) => r.id === reportId) ?? null;
        this.report.set(found);
      },
      error: () => {
        this.report.set(null);
      },
    });

    // Load filter definitions
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
   * This is the only way data gets loaded — the user must explicitly click "Ejecutar".
   */
  executeReport(): void {
    const report = this.report();
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
   * Clears all filter values and resets the results.
   */
  clearFilters(): void {
    const values: Record<string, string> = {};
    for (const f of this.filters()) {
      values[f.name] = '';
    }
    this.filterValues.set(values);
    this.hasExecuted.set(false);
    this.result.set(null);
    this.resultPage.set(0);
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
   * Changes the page size and re-executes from page 0.
   */
  changePageSize(size: number): void {
    this.resultSize.set(size);
    this.resultPage.set(0);
    if (this.hasExecuted()) {
      this.executeReport();
    }
  }

  /**
   * Exports the report in the given format.
   */
  exportReport(format: ExportFormat): void {
    const report = this.report();
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
