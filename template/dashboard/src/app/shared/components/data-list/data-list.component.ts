import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ContentChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { TpListItemDirective } from './directives/tp-list-item.directive';

/**
 * Reusable data list component with header, filter, pagination,
 * loading/empty states, and custom item templates.
 *
 * Follows the same architectural pattern as `TpDataTableComponent` but
 * renders items as a vertical list (list-group) instead of a table.
 *
 * Usage:
 * ```html
 * <tp-data-list
 *   [data]="items()"
 *   [loading]="isLoading()"
 *   [totalElements]="totalElements()"
 *   [currentPage]="currentPage()"
 *   [pageSize]="pageSize()"
 *   [title]="'ITEMS ASIGNADOS'"
 *   [filterable]="true"
 *   [showAdd]="true"
 *   [showRemove]="true"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)"
 *   (filterChange)="onFilter($event)"
 *   (add)="onAdd()"
 *   (remove)="onRemove($event)"
 *   ariaLabel="Lista de items asignados"
 *   testId="assigned-items">
 *
 *   <ng-template tpListItem let-item>
 *     <span>{{ item.name }}</span>
 *   </ng-template>
 * </tp-data-list>
 * ```
 */
@Component({
  selector: 'tp-data-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpDataListComponent<T> {

  // ─── Inputs ────────────────────────────────────────────────

  /** Data items for the current page. */
  @Input({ required: true }) data: T[] = [];

  /** Whether data is being loaded. */
  @Input() loading = false;

  /** Total number of elements (for pagination). */
  @Input() totalElements = 0;

  /** Current page index (0-based). */
  @Input() currentPage = 0;

  /** Number of elements per page. */
  @Input() pageSize = 10;

  /** Available page size options. */
  @Input() pageSizes: number[] = [5, 10, 20, 50];

  /** Title displayed in the header. */
  @Input() title = '';

  /** Whether the filter input is visible. */
  @Input() filterable = true;

  /** Placeholder text for the filter input. */
  @Input() filterPlaceholder = '';

  /** Current filter text (two-way bindable). */
  @Input() filterText = '';

  /** Whether the add button is visible. */
  @Input() showAdd = false;

  /** Whether remove buttons are visible per item. */
  @Input() showRemove = false;

  /** Whether the component is disabled. */
  @Input() disabled = false;

  /** Accessibility label for the list. */
  @Input() ariaLabel = '';

  /** data-testid prefix for testing. */
  @Input() testId = 'data-list';

  /** Whether to show pagination controls. */
  @Input() showPagination = true;

  // ─── Outputs ───────────────────────────────────────────────

  /** Emitted when the user navigates to a different page. */
  @Output() readonly pageChange = new EventEmitter<number>();

  /** Emitted when the user changes page size. */
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  /** Emitted when the filter text changes. */
  @Output() readonly filterChange = new EventEmitter<string>();

  /** Emitted when the add button is clicked. */
  @Output() readonly add = new EventEmitter<void>();

  /** Emitted when a remove button is clicked for an item. */
  @Output() readonly remove = new EventEmitter<T>();

  // ─── Content Children ──────────────────────────────────────

  @ContentChild(TpListItemDirective) itemTemplate?: TpListItemDirective;

  // ─── Computed Values ───────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 0;
  }

  get showingFrom(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
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

  // ─── Actions ───────────────────────────────────────────────

  /**
   * Handles filter input changes.
   */
  onFilterChange(value: string): void {
    this.filterText = value;
    this.filterChange.emit(value);
  }

  /**
   * Navigates to the specified page.
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  /**
   * Handles page size change.
   */
  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  /**
   * Handles add button click.
   */
  onAdd(): void {
    this.add.emit();
  }

  /**
   * Handles remove button click for an item.
   */
  onRemove(item: T): void {
    this.remove.emit(item);
  }
}
