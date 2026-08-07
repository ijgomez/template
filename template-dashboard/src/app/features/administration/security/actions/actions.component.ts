import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ActionService } from '../../../../core/services/action.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { TpDataTableComponent, TpColumnDirective, ColumnDef, SortEvent } from '../../../../shared/components/data-table';
import { Action, ActionCriteria } from './models/action.model';

/**
 * Actions list view component.
 * Displays a paginated table with filters (code, type) and CSV export.
 * Only supports Edit and View Detail options (no Create/Delete per Req 25.11).
 */
@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsComponent implements OnInit {
  private readonly actionService = inject(ActionService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly translateService = inject(TranslateService);

  // View state
  readonly viewMode = signal<'list' | 'detail' | 'edit'>('list');
  readonly selectedAction = signal<Action | null>(null);
  readonly selectedRow = signal<Action | null>(null);

  // Pagination state
  readonly actions = signal<Action[]>([]);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));
  readonly isLoading = signal(false);

  // Table columns
  readonly columns: ColumnDef[] = [
    { key: 'code', header: 'actions.table.code', sortable: true, resizable: true, reorderable: true },
    { key: 'name', header: 'actions.table.name', sortable: true, resizable: true, reorderable: true },
    { key: 'type', header: 'actions.table.type', sortable: true, resizable: true, reorderable: true },
    { key: 'description', header: 'actions.table.description' },
  ];

  // Sort state
  readonly sortParam = signal('');

  // Filter state
  readonly filterCode = signal('');
  readonly filterType = signal('');

  // Edit form state
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editType = signal('');
  readonly isSaving = signal(false);

  // Action types for filter dropdown
  readonly actionTypes = ['READ', 'WRITE', 'EXECUTE'];

  /** Whether the current user can edit actions */
  readonly canEdit = computed(() => this.authService.hasAction('ACTION_READ'));

  ngOnInit(): void {
    this.loadActions();
  }

  /**
   * Loads actions from the backend with current pagination and filters.
   */
  loadActions(): void {
    this.isLoading.set(true);
    const criteria = this.buildCriteria();
    const progressId = this.notificationService.showProgress('notification.pagination.progress');

    this.actionService.findByCriteria(criteria, this.currentPage(), this.pageSize(), this.sortParam()).subscribe({
      next: (page) => {
        this.actions.set(page.content);
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
    this.loadActions();
  }

  /**
   * Clears all filters and reloads.
   */
  clearFilters(): void {
    this.filterCode.set('');
    this.filterType.set('');
    this.currentPage.set(0);
    this.loadActions();
  }

  /**
   * Handles sort events from the data table.
   */
  onSort(event: SortEvent): void {
    this.sortParam.set(event.direction ? `${event.column},${event.direction}` : '');
    this.currentPage.set(0);
    this.loadActions();
  }

  /**
   * Navigates to a specific page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadActions();
    }
  }

  /**
   * Changes page size and reloads from page 0.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.selectedRow.set(null);
    this.loadActions();
  }

  /**
   * Selects or deselects a row in the table.
   */
  selectRow(action: Action): void {
    this.selectedRow.set(this.selectedRow()?.id === action.id ? null : action);
  }

  /**
   * Opens the edit form for the currently selected row.
   */
  editSelectedAction(): void {
    const row = this.selectedRow();
    if (row) {
      this.editAction(row);
    }
  }

  /**
   * Opens the detail view for an action.
   */
  viewDetail(action: Action): void {
    this.selectedAction.set(action);
    this.viewMode.set('detail');
  }

  /**
   * Opens the edit form for an action.
   */
  editAction(action: Action): void {
    this.selectedAction.set(action);
    this.editName.set(action.name);
    this.editDescription.set(action.description ?? '');
    this.editType.set(action.type);
    this.viewMode.set('edit');
  }

  /**
   * Saves the edited action.
   */
  saveAction(): void {
    const action = this.selectedAction();
    if (!action) return;

    this.isSaving.set(true);
    const progressId = this.notificationService.showProgress('notification.update.progress');

    const payload: Partial<Action> = {
      id: action.id,
      code: action.code,
      name: this.editName(),
      description: this.editDescription() || null,
      type: this.editType(),
    };

    this.actionService.update(action.id, payload).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.notificationService.updateToSuccess(progressId, 'notification.update.success');
        this.selectedAction.set(updated);
        this.backToList();
        this.loadActions();
      },
      error: () => {
        this.isSaving.set(false);
        this.notificationService.updateToError(progressId, 'notification.update.error');
      },
    });
  }

  /**
   * Returns to the list view.
   */
  backToList(): void {
    this.viewMode.set('list');
    this.selectedAction.set(null);
    this.selectedRow.set(null);
  }

  /**
   * Exports current page data to CSV.
   */
  exportCsv(): void {
    const data = this.actions();
    if (data.length === 0) return;

    const progressId = this.notificationService.showProgress('notification.export.progress');

    try {
      const headers = [
        this.translateService.instant('actions.table.code'),
        this.translateService.instant('actions.table.name'),
        this.translateService.instant('actions.table.type'),
        this.translateService.instant('actions.table.description'),
        this.translateService.instant('actions.table.createdAt'),
        this.translateService.instant('actions.table.lastModifiedAt'),
      ];

      const rows = data.map((action) => [
        action.code,
        action.name,
        action.type,
        action.description ?? '',
        action.createdAt,
        action.lastModifiedAt,
      ]);

      this.csvExportService.export(headers, rows, `actions_${new Date().toISOString().slice(0, 10)}`);
      this.notificationService.updateToSuccess(progressId, 'notification.export.success');
    } catch {
      this.notificationService.updateToError(progressId, 'notification.export.error');
    }
  }

  private buildCriteria(): ActionCriteria {
    const criteria: ActionCriteria = {};
    if (this.filterCode()) criteria.code = this.filterCode();
    if (this.filterType()) criteria.type = this.filterType();
    return criteria;
  }
}
