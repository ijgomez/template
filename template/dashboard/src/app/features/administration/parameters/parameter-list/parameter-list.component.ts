import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ParameterService } from '../../../../core/services/parameter.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../../shared/components/data-table';
import { Parameter, ParameterCriteria, ParameterType } from '../../../../core/models/parameter.model';
import { ParameterFormComponent } from '../parameter-form/parameter-form.component';
import { TpDetailButtonComponent } from '../../../../shared/components/detail-button';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

/**
 * Parameters orchestrator component.
 * Manages the list view, navigation between views, and delegates
 * detail display and form handling to child components.
 */
@Component({
  selector: 'app-parameter-list',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TpDataTableComponent, TpColumnDirective, ParameterFormComponent, TpDetailButtonComponent],
  templateUrl: './parameter-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterListComponent implements OnInit {
  private readonly parameterService = inject(ParameterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ─── View State ──────────────────────────────────────────────

  readonly viewMode = signal<ViewMode>('list');
  readonly isLoading = signal(false);

  // ─── List State ──────────────────────────────────────────────

  readonly parameters = signal<Parameter[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly sortParam = signal('');

  // ─── Filter State ────────────────────────────────────────────

  readonly filterCode = signal('');
  readonly filterDescription = signal('');
  readonly filterType = signal<ParameterType | ''>('');

  // ─── Row Selection ───────────────────────────────────────────

  readonly selectedRow = signal<Parameter | null>(null);

  // ─── Detail / Form State ─────────────────────────────────────

  readonly formData = signal<Parameter>(this.emptyParameter());

  // ─── Delete Confirmation ─────────────────────────────────────

  readonly showDeleteConfirm = signal(false);
  readonly deleteTarget = signal<Parameter | null>(null);

  // ─── Constants ───────────────────────────────────────────────

  readonly pageSizes = [5, 10, 20, 50];
  readonly parameterTypes: ParameterType[] = ['STRING', 'INTEGER', 'BOOLEAN', 'DATE'];

  readonly columns: ColumnDef[] = [
    { key: 'code', header: 'parameters.fields.code', sortable: true, resizable: true, reorderable: true },
    { key: 'description', header: 'parameters.fields.description', sortable: true, resizable: true, reorderable: true },
    { key: 'type', header: 'parameters.fields.type', sortable: true, resizable: true, reorderable: true },
    { key: 'value', header: 'parameters.fields.value' },
  ];

  // ─── Computed ────────────────────────────────────────────────

  readonly canWrite = computed(() => this.authService.hasAction('SYSTEM_PARAMETER_WRITE'));
  readonly showingFrom = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  /** Snapshot of the active filter values. Drives automatic (debounced) search. */
  private readonly filterState = computed(() => ({
    code: this.filterCode(),
    description: this.filterDescription(),
    type: this.filterType(),
  }));

  constructor() {
    this.loadParameters();

    // Automatically apply filters as the user types, debounced to avoid
    // flooding the backend on every keystroke (mirrors the auto-search UX).
    toObservable(this.filterState)
      .pipe(
        skip(1),
        debounceTime(300),
        distinctUntilChanged((a, b) => a.code === b.code && a.description === b.description && a.type === b.type),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.applyFilters());
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.restoreViewFromParams(params));
  }

  /**
   * Restores the view from URL query params (deep links, back/forward, reload):
   * `?view=create`, `?view=detail&code=<code>`, `?view=edit&code=<code>`, or list.
   * Parameters are identified by their unique `code`.
   */
  private restoreViewFromParams(params: Params): void {
    const view = params['view'] as ViewMode | undefined;
    const code = params['code'] ? String(params['code']) : null;

    if (view === 'create') {
      if (this.viewMode() !== 'create') {
        this.formData.set(this.emptyParameter());
        this.viewMode.set('create');
      }
      return;
    }

    if ((view === 'detail' || view === 'edit') && code !== null) {
      const known = this.parameters().find((p) => p.code === code) ?? (this.formData().code === code ? this.formData() : null);
      const apply = (parameter: Parameter) => {
        this.formData.set({ ...parameter });
        this.viewMode.set(view === 'edit' ? 'edit' : 'detail');
      };
      if (known) {
        apply(known);
      } else {
        this.parameterService.findByCode(code).subscribe({
          next: (parameter) => apply(parameter),
          error: () => this.goToListUrl(),
        });
      }
      return;
    }

    this.viewMode.set('list');
  }

  // ─── List Actions ────────────────────────────────────────────

  loadParameters(): void {
    this.isLoading.set(true);
    const criteria: ParameterCriteria = {};
    if (this.filterCode()) criteria.code = this.filterCode();
    if (this.filterDescription()) criteria.description = this.filterDescription();
    if (this.filterType()) criteria.type = this.filterType() as ParameterType;

    this.parameterService.findByCriteria(criteria, this.currentPage(), this.pageSize(), this.sortParam()).subscribe({
      next: (page) => {
        this.parameters.set(page.content);
        this.totalElements.set(page.page.totalElements);
        this.totalPages.set(page.page.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadParameters();
  }

  clearFilters(): void {
    this.filterCode.set('');
    this.filterDescription.set('');
    this.filterType.set('');
    this.currentPage.set(0);
    this.loadParameters();
  }

  onSort(event: SortEvent): void {
    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
    this.currentPage.set(0);
    this.loadParameters();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadParameters();
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadParameters();
  }

  // ─── Row Selection ───────────────────────────────────────────

  selectRow(parameter: Parameter): void {
    this.selectedRow.update(current => current?.code === parameter.code ? null : parameter);
  }

  viewSelectedParameter(): void {
    const row = this.selectedRow();
    if (row) {
      this.viewDetail(row);
    }
  }

  editSelectedParameter(): void {
    const row = this.selectedRow();
    if (row) {
      this.openEdit(row);
    }
  }

  deleteSelectedParameter(): void {
    const row = this.selectedRow();
    if (row) {
      this.confirmDelete(row);
    }
  }

  // ─── Navigation ──────────────────────────────────────────────

  viewDetail(parameter: Parameter): void {
    this.formData.set({ ...parameter });
    this.viewMode.set('detail');
    this.navigateToView('detail', parameter.code);
  }

  openCreate(): void {
    this.formData.set(this.emptyParameter());
    this.viewMode.set('create');
    this.navigateToView('create', null);
  }

  openEdit(parameter: Parameter): void {
    this.formData.set({ ...parameter });
    this.viewMode.set('edit');
    this.navigateToView('edit', parameter.code);
  }

  backToList(): void {
    this.viewMode.set('list');
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
    this.goToListUrl();
  }

  /** Reflects the current sub-view in the URL query params for deep linking. */
  private navigateToView(view: Exclude<ViewMode, 'list'>, code: string | null): void {
    const queryParams: Params = code ? { view, code } : { view };
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: '' });
  }

  /** Navigates back to the plain list URL (clears the sub-view query params). */
  private goToListUrl(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // ─── Save (delegated from form child) ───────────────────────

  saveParameter(parameter: Parameter): void {
    if (this.viewMode() === 'create') {
      const progressId = this.notificationService.showProgress('notification.create.progress');
      this.parameterService.create(parameter).subscribe({
        next: () => {
          this.notificationService.updateToSuccess(progressId, 'notification.create.success');
          this.backToList();
          this.loadParameters();
        },
        error: () => {
          this.notificationService.updateToError(progressId, 'notification.create.error');
        },
      });
    } else {
      const progressId = this.notificationService.showProgress('notification.update.progress');
      this.parameterService.update(parameter.code, parameter).subscribe({
        next: () => {
          this.notificationService.updateToSuccess(progressId, 'notification.update.success');
          this.backToList();
          this.loadParameters();
        },
        error: () => {
          this.notificationService.updateToError(progressId, 'notification.update.error');
        },
      });
    }
  }

  // ─── Delete ──────────────────────────────────────────────────

  confirmDelete(parameter: Parameter): void {
    this.deleteTarget.set(parameter);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    const progressId = this.notificationService.showProgress('notification.delete.progress');
    this.parameterService.delete(target.code).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.delete.success');
        this.showDeleteConfirm.set(false);
        this.deleteTarget.set(null);
        if (this.viewMode() === 'detail') {
          this.backToList();
        }
        this.loadParameters();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.delete.error');
        this.showDeleteConfirm.set(false);
        this.deleteTarget.set(null);
      },
    });
  }

  // ─── CSV Export ──────────────────────────────────────────────

  /**
   * Exports the full filtered list to CSV, ignoring the current pagination.
   * Fetches all rows matching the active filters from the backend.
   */
  exportCsv(): void {
    const criteria: ParameterCriteria = {};
    if (this.filterCode()) criteria.code = this.filterCode();
    if (this.filterDescription()) criteria.description = this.filterDescription();
    if (this.filterType()) criteria.type = this.filterType() as ParameterType;

    this.parameterService.findAllByCriteria(criteria, this.sortParam()).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.notificationService.showError('notification.export.empty');
          return;
        }

        const headers = ['code', 'description', 'value', 'type'];
        const rows = data.map((p) => [
          p.code ?? '',
          p.description ?? '',
          String(p.value ?? ''),
          p.type ?? '',
        ]);

        this.csvExportService.export(headers, rows, 'parameters');
        this.notificationService.showSuccess('notification.export.success');
      },
      error: () => {
        this.notificationService.showError('notification.export.error');
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private emptyParameter(): Parameter {
    return {
      id: null,
      code: '',
      description: '',
      value: '',
      type: 'STRING',
      createdAt: null,
      lastModifiedAt: null,
    };
  }
}
