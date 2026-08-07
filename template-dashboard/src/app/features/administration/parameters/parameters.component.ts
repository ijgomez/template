import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ParameterService } from '../../../core/services/parameter.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../shared/components/data-table';
import { Parameter, ParameterCriteria, ParameterType } from '../../../core/models/parameter.model';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './parameters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametersComponent {
  private readonly parameterService = inject(ParameterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<ViewMode>('list');
  readonly isLoading = signal(false);

  // List state
  readonly parameters = signal<Parameter[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  // Sort state
  readonly sortParam = signal('');

  // Filter state
  readonly filterCode = signal('');
  readonly filterDescription = signal('');
  readonly filterType = signal<ParameterType | ''>('');

  // Row selection
  readonly selectedRow = signal<Parameter | null>(null);

  // Page size options
  readonly pageSizes = [5, 10, 20, 50];

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'code', header: 'parameters.fields.code', sortable: true, resizable: true, reorderable: true },
    { key: 'description', header: 'parameters.fields.description', sortable: true, resizable: true, reorderable: true },
    { key: 'type', header: 'parameters.fields.type', sortable: true, resizable: true, reorderable: true },
    { key: 'value', header: 'parameters.fields.value' },
  ];

  // Detail/Form state
  readonly selectedParameter = signal<Parameter | null>(null);
  readonly formData = signal<Parameter>(this.emptyParameter());

  // Validation
  readonly typeValueError = signal('');

  // Delete confirmation
  readonly showDeleteConfirm = signal(false);
  readonly deleteTarget = signal<Parameter | null>(null);

  // Available types for dropdown
  readonly parameterTypes: ParameterType[] = ['STRING', 'INTEGER', 'BOOLEAN', 'DATE'];

  // Action-based button visibility
  readonly canWrite = computed(() => this.authService.hasAction('SYSTEM_PARAMETER_WRITE'));

  // Pagination display
  readonly showingFrom = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  constructor() {
    this.loadParameters();
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

  // ─── CSV Export ──────────────────────────────────────────────

  exportCsv(): void {
    const data = this.parameters();
    if (data.length === 0) return;

    const headers = ['code', 'description', 'value', 'type', 'createdAt', 'lastModifiedAt'];
    const csvRows = [
      headers.join(','),
      ...data.map(p =>
        [p.code, `"${(p.description || '').replace(/"/g, '""')}"`, `"${(p.value || '').replace(/"/g, '""')}"`, p.type, p.createdAt || '', p.lastModifiedAt || ''].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parameters.csv';
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.showSuccess('notification.export.success');
  }

  // ─── Navigation ──────────────────────────────────────────────

  viewDetail(parameter: Parameter): void {
    this.selectedParameter.set(parameter);
    this.viewMode.set('detail');
  }

  openCreate(): void {
    this.formData.set(this.emptyParameter());
    this.typeValueError.set('');
    this.viewMode.set('create');
  }

  openEdit(parameter: Parameter): void {
    this.formData.set({ ...parameter });
    this.typeValueError.set('');
    this.viewMode.set('edit');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.selectedParameter.set(null);
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  // ─── Form Actions ───────────────────────────────────────────

  onTypeChange(): void {
    this.validateTypeValue();
  }

  onValueChange(): void {
    this.validateTypeValue();
  }

  validateTypeValue(): boolean {
    const data = this.formData();
    const error = this.getTypeValueValidationError(data.type, data.value);
    this.typeValueError.set(error);
    return error === '';
  }

  saveParameter(): void {
    if (!this.validateTypeValue()) return;

    const data = this.formData();
    if (this.viewMode() === 'create') {
      const progressId = this.notificationService.showProgress('notification.create.progress');
      this.parameterService.create(data).subscribe({
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
      this.parameterService.update(data.code, data).subscribe({
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

  // ─── Delete Actions ─────────────────────────────────────────

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
        this.loadParameters();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.delete.error');
        this.showDeleteConfirm.set(false);
        this.deleteTarget.set(null);
      },
    });
  }

  // ─── Row Selection ────────────────────────────────────────────

  selectRow(parameter: Parameter): void {
    this.selectedRow.update(current => current?.code === parameter.code ? null : parameter);
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

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadParameters();
  }

  // ─── Helpers ────────────────────────────────────────────────

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

  private getTypeValueValidationError(type: ParameterType, value: string): string {
    if (!value) return '';

    switch (type) {
      case 'INTEGER':
        if (!/^-?\d+$/.test(value)) {
          return this.translateService.instant('parameters.validation.integer');
        }
        break;
      case 'BOOLEAN':
        if (value !== 'true' && value !== 'false') {
          return this.translateService.instant('parameters.validation.boolean');
        }
        break;
      case 'DATE':
        if (!this.isValidIso8601(value)) {
          return this.translateService.instant('parameters.validation.date');
        }
        break;
      case 'STRING':
        // Any value is valid for STRING type
        break;
    }
    return '';
  }

  private isValidIso8601(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value);
  }
}