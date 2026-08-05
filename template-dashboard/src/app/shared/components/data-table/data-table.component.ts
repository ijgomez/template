import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { ColumnDef } from './models/column-def.model';
import { TpColumnDirective } from './directives/tp-column.directive';

/**
 * Reusable data table component with pagination, row selection,
 * loading/empty states, and custom cell templates.
 *
 * Follows the Design System `tp-table` pattern defined in design-system.md.
 */
@Component({
  selector: 'tp-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpDataTableComponent<T extends { id?: number | string | null }> {
  // ─── Inputs ────────────────────────────────────────────────

  /** Column definitions. */
  @Input({ required: true }) columns: ColumnDef[] = [];

  /** Data rows for the current page. */
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

  /** Whether rows are selectable. */
  @Input() selectable = true;

  /** Currently selected item (compared by id). */
  @Input() selectedItem: T | null = null;

  /** Accessibility label for the table. */
  @Input() ariaLabel = '';

  /** data-testid attribute for the table element. */
  @Input() testId = '';

  // ─── Outputs ───────────────────────────────────────────────

  /** Emitted when the user navigates to a different page. */
  @Output() readonly pageChange = new EventEmitter<number>();

  /** Emitted when the user changes page size. */
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  /** Emitted when the user selects/deselects a row. */
  @Output() readonly rowSelect = new EventEmitter<T>();

  /** Emitted on double-click on a row. */
  @Output() readonly rowDoubleClick = new EventEmitter<T>();

  // ─── Content Children ──────────────────────────────────────

  @ContentChildren(TpColumnDirective) columnTemplates!: QueryList<TpColumnDirective>;

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

  // ─── Methods ───────────────────────────────────────────────

  /**
   * Returns the custom template for a given column key, if defined.
   */
  getColumnTemplate(key: string): TpColumnDirective | undefined {
    return this.columnTemplates?.find(t => t.tpColumn === key);
  }

  /**
   * Returns the cell value for a given row and column key.
   */
  getCellValue(item: T, key: string): unknown {
    return (item as Record<string, unknown>)[key] ?? '';
  }

  /**
   * Checks if a row is currently selected.
   */
  isSelected(item: T): boolean {
    if (!this.selectedItem || !item) return false;
    return this.selectedItem.id === item.id;
  }

  /**
   * Handles row click for selection.
   */
  onRowClick(item: T): void {
    if (!this.selectable) return;
    this.rowSelect.emit(item);
  }

  /**
   * Handles row double-click.
   */
  onRowDoubleClick(item: T): void {
    this.rowDoubleClick.emit(item);
  }

  /**
   * Navigates to a specific page.
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
}
