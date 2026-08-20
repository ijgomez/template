import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ParameterService } from '../../../core/services/parameter.service';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../shared/components/data-table';
import { Parameter, ParameterCriteria, ParameterType } from '../../../core/models/parameter.model';
import { ParameterDetailComponent } from './parameter-detail/parameter-detail.component';
import { ParameterFormComponent } from './parameter-form/parameter-form.component';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

/**
 * Parameters orchestrator component.
 * Manages the list view, navigation between views, and delegates
 * detail display and form handling to child components.
 */
@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TpDataTableComponent, TpColumnDirective, ParameterDetailComponent, ParameterFormComponent],
  templateUrl: './parameters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametersComponent {
  private readonly parameterService = inject(ParameterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

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

  readonly selectedParameter = signal<Parameter | null>(null);
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

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadParameters();
  }

  // ─── Row Selection ───────────────────────────────────────────

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

  // ─── Navigation ──────────────────────────────────────────────

  viewDetail(parameter: Parameter): void {
    this.selectedParameter.set(parameter);
    this.viewMode.set('detail');
  }

  openCreate(): void {
    this.formData.set(this.emptyParameter());
    this.viewMode.set('create');
  }

  openEdit(parameter: Parameter): void {
    this.formData.set({ ...parameter });
    this.viewMode.set('edit');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.selectedParameter.set(null);
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
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
