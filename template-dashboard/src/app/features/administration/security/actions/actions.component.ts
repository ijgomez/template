import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ActionService } from '../../../../core/services/action.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocalDatePipe } from '../../../../shared/pipes/local-date.pipe';
import { Action, ActionCriteria } from './models/action.model';

/**
 * Actions list view component.
 * Displays a paginated table with filters (code, name, type) and CSV export.
 * Only supports Edit and View Detail options (no Create/Delete per Req 25.11).
 */
@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LocalDatePipe],
  templateUrl: './actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsComponent implements OnInit {
  private readonly actionService = inject(ActionService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
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

  // Filter state
  readonly filterCode = signal('');
  readonly filterName = signal('');
  readonly filterType = signal('');

  // Edit form state
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editType = signal('');
  readonly isSaving = signal(false);

  // Pagination display helpers
  readonly showingFrom = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly showingTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  // Action types for filter dropdown
  readonly actionTypes = ['READ', 'WRITE', 'EXECUTE'];

  // Page size options
  readonly pageSizes = [5, 10, 20, 50];

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

    this.actionService.findByCriteria(criteria, this.currentPage(), this.pageSize()).subscribe({
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
    this.filterName.set('');
    this.filterType.set('');
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

      const rows = this.actions().map((action) => [
        this.escapeCsvField(action.code),
        this.escapeCsvField(action.name),
        this.escapeCsvField(action.type),
        this.escapeCsvField(action.description ?? ''),
        this.escapeCsvField(action.createdAt),
        this.escapeCsvField(action.lastModifiedAt),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `actions_${new Date().toISOString().slice(0, 10)}.csv`;
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
   * Changes the page size and reloads from page 0.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.selectedRow.set(null);
    this.loadActions();
  }

  private buildCriteria(): ActionCriteria {
    const criteria: ActionCriteria = {};
    if (this.filterCode()) criteria.code = this.filterCode();
    if (this.filterName()) criteria.name = this.filterName();
    if (this.filterType()) criteria.type = this.filterType();
    return criteria;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
