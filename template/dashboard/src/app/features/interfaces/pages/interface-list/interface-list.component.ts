import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { InterfaceService } from '../../../../core/services/interface.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DateService } from '../../../../core/services/date.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../../shared/components/data-table';
import { TpInterfaceSelectComponent } from '../../components/interface-select';
import {
  InterfaceLog,
  InterfaceLogCriteria,
  InterfaceOperationType,
  InterfaceLogStatus,
} from '../../../../core/models/interface.model';

/**
 * Interface monitor component.
 * Displays a paginated, filterable table of interface operation logs (read-only per Req 25.12).
 * Supports detail view and CSV export.
 */
@Component({
  selector: 'app-interface-list',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    LocalDatePipe,
    TpDatePickerComponent,
    TpDataTableComponent,
    TpColumnDirective,
    TpInterfaceSelectComponent,
  ],
  templateUrl: './interface-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceListComponent implements OnInit {
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly dateService = inject(DateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

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

  // Sort state
  readonly sortParam = signal('');

  // Filter state
  readonly filterDateFrom = signal('');
  readonly filterDateTo = signal('');
  readonly filterOperationType = signal('');
  readonly filterInterfaceName = signal('');
  readonly filterStatus = signal('');

  readonly hasInvalidDateRange = computed(
    () => !!this.filterDateFrom() && !!this.filterDateTo() && this.filterDateFrom() > this.filterDateTo(),
  );

  readonly isFilterDisabled = computed(() => this.isLoading() || this.hasInvalidDateRange());

  // Filter dropdown options
  readonly operationTypes: InterfaceOperationType[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  readonly logStatuses: InterfaceLogStatus[] = ['SUCCESS', 'ERROR', 'BAD_REQUEST', 'NOT_FOUND'];

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Page size options for the selector
  readonly pageSizeOptions = [5, 10, 20, 50];

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'timestamp', header: 'interfaces.interfaceList.fields.timestamp', sortable: true, resizable: true, reorderable: true },
    { key: 'operationType', header: 'interfaces.interfaceList.fields.operationType', sortable: true, resizable: true, reorderable: true },
    { key: 'interfaceName', header: 'interfaces.interfaceList.fields.interfaceName', sortable: true, resizable: true, reorderable: true },
    { key: 'status', header: 'interfaces.interfaceList.fields.status', sortable: true, resizable: true, reorderable: true },
  ];

  /** Snapshot of the active filter values. Drives automatic (debounced) search. */
  private readonly filterState = computed(() => ({
    dateFrom: this.filterDateFrom(),
    dateTo: this.filterDateTo(),
    operationType: this.filterOperationType(),
    interfaceName: this.filterInterfaceName(),
    status: this.filterStatus(),
  }));

  constructor() {
    // Automatically apply filters as the user types or picks values, debounced
    // to avoid flooding the backend on every keystroke. applyFilters() already
    // skips the request when the date range is invalid.
    toObservable(this.filterState)
      .pipe(
        skip(1),
        debounceTime(300),
        distinctUntilChanged(
          (a, b) =>
            a.dateFrom === b.dateFrom &&
            a.dateTo === b.dateTo &&
            a.operationType === b.operationType &&
            a.interfaceName === b.interfaceName &&
            a.status === b.status,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.applyFilters());
  }

  ngOnInit(): void {
    this.loadLogs();
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.restoreViewFromParams(params));
  }

  /**
   * Restores the view from URL query params (deep links, back/forward, reload):
   * `?view=detail&id=<id>` opens the log detail if it is in the loaded page;
   * otherwise the list. Logs are server-paginated, so a deep link to a log
   * outside the current page falls back to the list.
   */
  private restoreViewFromParams(params: Params): void {
    const view = params['view'];
    const id = params['id'] ? Number(params['id']) : null;

    if (view === 'detail' && id !== null) {
      const log = this.logs().find((l) => l.id === id) ?? (this.selectedLog()?.id === id ? this.selectedLog() : null);
      if (log) {
        this.selectedLog.set(log);
        this.viewMode.set('detail');
      } else {
        this.goToListUrl();
      }
      return;
    }

    this.viewMode.set('list');
  }

  /**
   * Loads interface logs from the backend with current pagination and filters.
   */
  loadLogs(): void {
    this.isLoading.set(true);
    const criteria = this.buildCriteria();
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.interfaceService.findLogsByCriteria(criteria, this.currentPage(), this.pageSize(), this.sortParam()).subscribe({
      next: (page) => {
        this.logs.set(page.content);
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
    this.loadLogs();
  }

  /**
   * Clears all filters and reloads.
   */
  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterOperationType.set('');
    this.filterInterfaceName.set('');
    this.filterStatus.set('');
    this.currentPage.set(0);
    this.loadLogs();
  }

  /**
   * Handles sort events from the data table.
   */
  onSort(event: SortEvent): void {
    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
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
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: 'detail', id: log.id }, queryParamsHandling: '' });
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
    this.goToListUrl();
  }

  /** Navigates back to the plain list URL (clears the sub-view query params). */
  private goToListUrl(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /**
   * Exports the full filtered list to CSV, ignoring the current pagination.
   * Fetches all rows matching the active criteria from the backend.
   */
  exportCsv(): void {
    const progressId = this.notificationService.showProgress('notification.export.progress');

    this.interfaceService.findAllLogsByCriteria(this.buildCriteria(), this.sortParam()).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.notificationService.updateToError(progressId, 'notification.export.empty');
          return;
        }

        try {
          const headers = [
            this.translateService.instant('interfaces.interfaceList.fields.timestamp'),
            this.translateService.instant('interfaces.interfaceList.fields.operationType'),
            this.translateService.instant('interfaces.interfaceList.fields.interfaceName'),
            this.translateService.instant('interfaces.interfaceList.fields.status'),
          ];

          const rows = data.map((log) => [
            this.escapeCsvField(log.timestamp ? this.dateService.toLocalString(log.timestamp) : ''),
            this.escapeCsvField(log.operationType),
            this.escapeCsvField(log.interfaceName),
            this.escapeCsvField(log.status),
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
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.export.error');
      },
    });
  }

  private buildCriteria(): InterfaceLogCriteria {
    const criteria: InterfaceLogCriteria = {};
    if (this.filterDateFrom()) criteria.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) criteria.dateTo = this.filterDateTo();
    if (this.filterOperationType()) criteria.operationType = this.filterOperationType() as InterfaceOperationType;
    if (this.filterInterfaceName()) criteria.interfaceName = this.filterInterfaceName();
    if (this.filterStatus()) criteria.status = this.filterStatus() as InterfaceLogStatus;
    return criteria;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replaceAll(/"/g, '""')}"`;
    }
    return field;
  }
}
