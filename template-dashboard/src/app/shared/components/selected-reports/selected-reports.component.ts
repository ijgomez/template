import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  forwardRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { Report } from '../../../core/models/report.model';
import { Page } from '../../../core/models/page.model';
import { ReportService } from '../../../core/services/report.service';

/**
 * Reusable ControlValueAccessor component that manages a list of selected reports.
 *
 * - Displays the currently selected reports with filter and remove button
 * - Opens a paginated modal with server-side search to add/remove reports
 * - Writes the selected report IDs (number[]) as form value
 *
 * Usage:
 * ```html
 * <tp-selected-reports
 *   formControlName="reports"
 *   [title]="'INFORMES ASIGNADOS'">
 * </tp-selected-reports>
 * ```
 */
@Component({
  selector: 'tp-selected-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './selected-reports.component.html',
  styleUrls: ['./selected-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TpSelectedReportsComponent),
      multi: true,
    },
  ],
})
export class TpSelectedReportsComponent implements ControlValueAccessor, OnInit {
  private readonly reportService = inject(ReportService);

  // ─── Inputs ────────────────────────────────────────────────

  /** Title displayed in the header. */
  @Input() title = '';

  /** Whether the add button is visible. */
  @Input() showAdd = true;

  /** Whether the remove buttons are visible. */
  @Input() showRemove = true;

  /** Placeholder text for the filter input. */
  @Input() filterPlaceholder = '';

  /** Accessibility label for the list. */
  @Input() ariaLabel = '';

  /** data-testid prefix for testing. */
  @Input() testId = 'selected-reports';

  // ─── Internal State ────────────────────────────────────────

  /** Cache of reports loaded (for resolving selected IDs to names). */
  readonly reportsCache = signal<Map<number, Report>>(new Map());

  /** IDs of selected reports (form model value). */
  readonly selectedIds = signal<number[]>([]);

  /** Filter text for the selected list. */
  readonly filterText = signal('');

  /** Whether the component is disabled. */
  readonly disabled = signal(false);

  /** Whether selected reports are being loaded. */
  readonly loading = signal(false);

  // ─── Modal State ───────────────────────────────────────────

  /** Whether the selection modal is open. */
  readonly modalOpen = signal(false);

  /** Search text within the modal. */
  readonly modalSearch = signal('');

  /** Current page in the modal (0-based). */
  readonly modalPage = signal(0);

  /** Page size in the modal. */
  readonly modalPageSize = signal(5);

  /** Reports on the current modal page (from backend). */
  readonly modalReports = signal<Report[]>([]);

  /** Total elements in the backend (for pagination). */
  readonly modalTotalElements = signal(0);

  /** Whether the modal is loading data. */
  readonly modalLoading = signal(false);

  /** Temporary selection state within the modal (IDs). */
  readonly modalSelectedIds = signal<number[]>([]);

  // ─── Computed: Selected List ───────────────────────────────

  /** Selected reports resolved from IDs and cache. */
  readonly selectedReports = computed(() => {
    const ids = this.selectedIds();
    const cache = this.reportsCache();
    return ids.map(id => cache.get(id)).filter((r): r is Report => r != null);
  });

  /** Filtered selected reports based on the filter text. */
  readonly filteredSelectedReports = computed(() => {
    const text = this.filterText().toLowerCase().trim();
    const items = this.selectedReports();
    if (!text) {
      return items;
    }
    return items.filter(item => item.name.toLowerCase().includes(text));
  });

  /** Total count of selected items (unfiltered). */
  readonly totalCount = computed(() => this.selectedIds().length);

  // ─── Computed: Modal ───────────────────────────────────────

  /** Total pages in modal. */
  readonly modalTotalPages = computed(() => Math.ceil(this.modalTotalElements() / this.modalPageSize()) || 1);

  /** Showing from index. */
  readonly modalShowingFrom = computed(() =>
    this.modalTotalElements() === 0 ? 0 : this.modalPage() * this.modalPageSize() + 1
  );

  /** Showing to index. */
  readonly modalShowingTo = computed(() =>
    Math.min((this.modalPage() + 1) * this.modalPageSize(), this.modalTotalElements())
  );

  /** Number of reports selected in modal. */
  readonly modalSelectedCount = computed(() => this.modalSelectedIds().length);

  /** Visible page numbers (max 5). */
  readonly modalVisiblePages = computed(() => {
    const total = this.modalTotalPages();
    const current = this.modalPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i);
    }
    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, start + 4);
    if (end - start < 4) {
      start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  /** Whether all reports on the current page are selected. */
  get allPageReportsSelected(): boolean {
    const currentPage = this.modalReports();
    return currentPage.length > 0 && currentPage.every(r => this.modalSelectedIds().includes(r.id));
  }

  // ─── CVA Callbacks ─────────────────────────────────────────

  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadSelectedReports();
  }

  // ─── ControlValueAccessor ──────────────────────────────────

  writeValue(value: number[] | null): void {
    this.selectedIds.set(value ?? []);
    this.loadSelectedReports();
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ─── List Actions ──────────────────────────────────────────

  /**
   * Updates the filter text for the selected list.
   */
  onFilterChange(value: string): void {
    this.filterText.set(value);
  }

  /**
   * Removes a report from the selected list.
   */
  removeReport(report: Report): void {
    const updated = this.selectedIds().filter(id => id !== report.id);
    this.selectedIds.set(updated);
    this.onChange(updated);
    this.onTouched();
  }

  // ─── Modal Actions ─────────────────────────────────────────

  /**
   * Opens the selection modal and loads the first page.
   */
  openModal(): void {
    if (this.disabled()) {
      return;
    }
    this.modalSelectedIds.set([...this.selectedIds()]);
    this.modalSearch.set('');
    this.modalPage.set(0);
    this.modalOpen.set(true);
    this.loadModalPage();
    this.onTouched();
  }

  /**
   * Closes the selection modal without saving.
   */
  closeModal(): void {
    this.modalOpen.set(false);
  }

  /**
   * Confirms the selection in the modal and updates the form value.
   */
  confirmSelection(): void {
    const selected = [...this.modalSelectedIds()];
    this.selectedIds.set(selected);
    this.onChange(selected);
    this.modalOpen.set(false);
    this.loadSelectedReports();
  }

  /**
   * Toggles a report in the modal selection.
   */
  toggleModalReport(reportId: number): void {
    this.modalSelectedIds.update(ids => {
      if (ids.includes(reportId)) {
        return ids.filter(id => id !== reportId);
      }
      return [...ids, reportId];
    });
  }

  /**
   * Checks if a report is selected in the modal.
   */
  isModalReportSelected(reportId: number): boolean {
    return this.modalSelectedIds().includes(reportId);
  }

  /**
   * Toggles all reports on the current page.
   */
  toggleAllModalReports(): void {
    const currentPage = this.modalReports();
    const allSelected = currentPage.every(r => this.modalSelectedIds().includes(r.id));
    if (allSelected) {
      this.modalSelectedIds.update(ids => ids.filter(id => !currentPage.some(r => r.id === id)));
    } else {
      this.modalSelectedIds.update(ids => {
        const newIds = [...ids];
        currentPage.forEach(r => { if (!newIds.includes(r.id)) newIds.push(r.id); });
        return newIds;
      });
    }
  }

  /**
   * Navigates to a page in the modal (triggers server-side fetch).
   */
  modalGoToPage(page: number): void {
    if (page >= 0 && page < this.modalTotalPages()) {
      this.modalPage.set(page);
      this.loadModalPage();
    }
  }

  /**
   * Handles search text change in the modal (resets to page 0).
   */
  onModalSearchChange(value: string): void {
    this.modalSearch.set(value);
    this.modalPage.set(0);
    this.loadModalPage();
  }

  /**
   * Handles page size change in the modal.
   */
  onModalPageSizeChange(size: number): void {
    this.modalPageSize.set(size);
    this.modalPage.set(0);
    this.loadModalPage();
  }

  // ─── Private ───────────────────────────────────────────────

  /**
   * Loads a page of reports from the backend for the modal.
   */
  private loadModalPage(): void {
    this.modalLoading.set(true);
    this.reportService.search(this.modalSearch(), this.modalPage(), this.modalPageSize()).subscribe({
      next: (page) => {
        this.modalReports.set(page.content);
        this.modalTotalElements.set(page.page.totalElements);
        this.updateCache(page.content);
        this.modalLoading.set(false);
      },
      error: () => {
        this.modalLoading.set(false);
      },
    });
  }

  /**
   * Loads the reports that are currently selected (to resolve names for the list).
   * Uses findAll to populate the cache for all selected IDs.
   */
  private loadSelectedReports(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) {
      return;
    }
    // Check if all IDs are already cached
    const cache = this.reportsCache();
    const uncached = ids.filter(id => !cache.has(id));
    if (uncached.length === 0) {
      return;
    }
    this.loading.set(true);
    this.reportService.findAll().subscribe({
      next: (reports) => {
        this.updateCache(reports);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  /**
   * Updates the internal cache with new report data.
   */
  private updateCache(reports: Report[]): void {
    this.reportsCache.update(cache => {
      const newCache = new Map(cache);
      reports.forEach(r => newCache.set(r.id, r));
      return newCache;
    });
  }
}
