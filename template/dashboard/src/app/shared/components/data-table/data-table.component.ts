import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  Renderer2,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ColumnDef } from './models/column-def.model';
import { SortDirection, SortEvent } from './models/sort-event.model';
import { TpColumnDirective } from './directives/tp-column.directive';

/**
 * Reusable data table component with pagination, row selection,
 * column sorting, column resizing, column reordering (drag & drop),
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
export class TpDataTableComponent<T extends { id?: number | string | null }> implements OnInit {
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

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

  /** Emitted when the user changes the sort state. */
  @Output() readonly sortChange = new EventEmitter<SortEvent>();

  /** Emitted when a column is resized. Emits the column key and new width in pixels. */
  @Output() readonly columnResize = new EventEmitter<{ column: string; width: number }>();

  /** Emitted when columns are reordered via drag & drop. Emits the new column order. */
  @Output() readonly columnsReorder = new EventEmitter<ColumnDef[]>();

  // ─── Content Children ──────────────────────────────────────

  @ContentChildren(TpColumnDirective) columnTemplates!: QueryList<TpColumnDirective>;

  // ─── Sort State ────────────────────────────────────────────

  /** Currently sorted column key. */
  sortColumn = '';

  /** Current sort direction. */
  sortDirection: SortDirection = '';

  // ─── Resize State ──────────────────────────────────────────

  /** Runtime column widths (in pixels), keyed by column key. */
  columnWidths: Record<string, number> = {};

  /** Whether a resize operation is in progress. */
  private resizing = false;

  /** Subject to cancel the current resize drag. */
  private readonly resizeStop$ = new Subject<void>();

  // ─── Drag & Drop State ─────────────────────────────────────

  /** The column key being dragged. */
  dragColumnKey: string | null = null;

  /** The column key currently being hovered over during drag. */
  dragOverColumnKey: string | null = null;

  // ─── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.initColumnWidths();
  }

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

  // ─── Sort Methods ──────────────────────────────────────────

  /**
   * Handles column header click for sorting.
   * Cycles through: asc → desc → none.
   */
  onSortColumn(col: ColumnDef): void {
    if (!col.sortable) return;

    let direction: SortDirection;

    if (this.sortColumn !== col.key) {
      direction = 'asc';
    } else {
      switch (this.sortDirection) {
        case 'asc':
          direction = 'desc';
          break;
        case 'desc':
          direction = '';
          break;
        default:
          direction = 'asc';
      }
    }

    this.sortColumn = direction ? col.key : '';
    this.sortDirection = direction;
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  /**
   * Returns the aria-sort value for a column header.
   */
  getAriaSort(col: ColumnDef): string {
    if (!col.sortable) return 'none';
    if (this.sortColumn !== col.key) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : this.sortDirection === 'desc' ? 'descending' : 'none';
  }

  // ─── Resize Methods ────────────────────────────────────────

  /**
   * Starts a column resize operation on mousedown on the resize handle.
   */
  onResizeStart(event: MouseEvent, col: ColumnDef, thElement: HTMLElement): void {
    if (!col.resizable) return;

    event.preventDefault();
    event.stopPropagation();

    this.resizing = true;
    const startX = event.clientX;
    const startWidth = thElement.offsetWidth;
    const minWidth = col.minWidth ?? 50;
    const maxWidth = col.maxWidth ?? Infinity;

    this.renderer.addClass(document.body, 'tp-table-resizing');

    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(takeUntil(this.resizeStop$), takeUntilDestroyed(this.destroyRef))
      .subscribe(moveEvent => {
        const diff = moveEvent.clientX - startX;
        let newWidth = startWidth + diff;
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        this.columnWidths[col.key] = newWidth;
        this.cdr.markForCheck();
      });

    fromEvent<MouseEvent>(document, 'mouseup')
      .pipe(takeUntil(this.resizeStop$), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeStop$.next();
        this.resizing = false;
        this.renderer.removeClass(document.body, 'tp-table-resizing');
        if (this.columnWidths[col.key]) {
          this.columnResize.emit({ column: col.key, width: this.columnWidths[col.key] });
        }
      });
  }

  /**
   * Returns the computed style for a column width.
   */
  getColumnStyle(col: ColumnDef): Record<string, string> {
    const width = this.columnWidths[col.key];
    if (width) {
      return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
    }
    if (col.width) {
      return { width: col.width };
    }
    return {};
  }

  // ─── Drag & Drop Methods ───────────────────────────────────

  /**
   * Handles the start of a column drag operation.
   */
  onDragStart(event: DragEvent, col: ColumnDef): void {
    if (!col.reorderable || this.resizing) {
      event.preventDefault();
      return;
    }
    this.dragColumnKey = col.key;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', col.key);
    }
  }

  /**
   * Handles dragover to allow drop.
   */
  onDragOver(event: DragEvent, col: ColumnDef): void {
    if (!col.reorderable || !this.dragColumnKey) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverColumnKey = col.key;
  }

  /**
   * Handles dragleave to clear drop target indicator.
   */
  onDragLeave(col: ColumnDef): void {
    if (this.dragOverColumnKey === col.key) {
      this.dragOverColumnKey = null;
    }
  }

  /**
   * Handles drop to reorder columns.
   */
  onDrop(event: DragEvent, targetCol: ColumnDef): void {
    event.preventDefault();
    if (!this.dragColumnKey || this.dragColumnKey === targetCol.key) {
      this.resetDragState();
      return;
    }

    const fromIndex = this.columns.findIndex(c => c.key === this.dragColumnKey);
    const toIndex = this.columns.findIndex(c => c.key === targetCol.key);

    if (fromIndex >= 0 && toIndex >= 0) {
      const newColumns = [...this.columns];
      const [moved] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, moved);
      this.columns = newColumns;
      this.columnsReorder.emit(newColumns);
      this.cdr.markForCheck();
    }

    this.resetDragState();
  }

  /**
   * Handles drag end (cleanup).
   */
  onDragEnd(): void {
    this.resetDragState();
  }

  // ─── Template Methods ──────────────────────────────────────

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

  // ─── Private Helpers ───────────────────────────────────────

  /**
   * Initializes runtime column widths from ColumnDef.width values that are in pixels.
   */
  private initColumnWidths(): void {
    for (const col of this.columns) {
      if (col.width && col.width.endsWith('px')) {
        const parsed = parseInt(col.width, 10);
        if (!isNaN(parsed)) {
          this.columnWidths[col.key] = parsed;
        }
      }
    }
  }

  /**
   * Resets drag & drop state.
   */
  private resetDragState(): void {
    this.dragColumnKey = null;
    this.dragOverColumnKey = null;
  }
}
