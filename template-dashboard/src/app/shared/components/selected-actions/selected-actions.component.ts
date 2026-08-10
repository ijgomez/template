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

import { Action } from '../../../features/administration/security/profiles/models/profile.model';
import { ProfileService } from '../../../core/services/profile.service';

/**
 * Reusable ControlValueAccessor component that manages a list of selected actions.
 *
 * - Displays the currently selected actions with filter and remove button
 * - Opens a paginated modal with client-side search to add/remove actions
 * - Writes the selected action IDs (number[]) as form value
 *
 * Usage:
 * ```html
 * <tp-selected-actions
 *   formControlName="actions"
 *   [title]="'ACCIONES ASIGNADAS'">
 * </tp-selected-actions>
 * ```
 */
@Component({
  selector: 'tp-selected-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './selected-actions.component.html',
  styleUrls: ['./selected-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TpSelectedActionsComponent),
      multi: true,
    },
  ],
})
export class TpSelectedActionsComponent implements ControlValueAccessor, OnInit {
  private readonly profileService = inject(ProfileService);

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
  @Input() testId = 'selected-actions';

  // ─── Internal State ────────────────────────────────────────

  /** All actions loaded from the backend. */
  readonly allActions = signal<Action[]>([]);

  /** IDs of selected actions (form model value). */
  readonly selectedIds = signal<number[]>([]);

  /** Filter text for the selected list. */
  readonly filterText = signal('');

  /** Whether the component is disabled. */
  readonly disabled = signal(false);

  /** Whether actions are being loaded. */
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

  /** Whether the modal is loading data. */
  readonly modalLoading = signal(false);

  /** Temporary selection state within the modal (IDs). */
  readonly modalSelectedIds = signal<number[]>([]);

  // ─── Computed: Selected List ───────────────────────────────

  /** Selected actions resolved from IDs and loaded actions. */
  readonly selectedActions = computed(() => {
    const ids = this.selectedIds();
    const actions = this.allActions();
    return ids.map(id => actions.find(a => a.id === id)).filter((a): a is Action => a != null);
  });

  /** Filtered selected actions based on the filter text. */
  readonly filteredSelectedActions = computed(() => {
    const text = this.filterText().toLowerCase().trim();
    const items = this.selectedActions();
    if (!text) {
      return items;
    }
    return items.filter(item =>
      item.code.toLowerCase().includes(text) || item.name.toLowerCase().includes(text)
    );
  });

  /** Total count of selected items (unfiltered). */
  readonly totalCount = computed(() => this.selectedIds().length);

  // ─── Computed: Modal (client-side pagination) ──────────────

  /** Actions filtered by modal search text. */
  readonly modalFilteredActions = computed(() => {
    const text = this.modalSearch().toLowerCase().trim();
    const actions = this.allActions();
    if (!text) {
      return actions;
    }
    return actions.filter(a =>
      a.code.toLowerCase().includes(text) || a.name.toLowerCase().includes(text)
    );
  });

  /** Total elements after modal filtering. */
  readonly modalTotalElements = computed(() => this.modalFilteredActions().length);

  /** Total pages in modal. */
  readonly modalTotalPages = computed(() => Math.ceil(this.modalTotalElements() / this.modalPageSize()) || 1);

  /** Actions on the current modal page. */
  readonly modalPageActions = computed(() => {
    const filtered = this.modalFilteredActions();
    const start = this.modalPage() * this.modalPageSize();
    return filtered.slice(start, start + this.modalPageSize());
  });

  /** Showing from index. */
  readonly modalShowingFrom = computed(() =>
    this.modalTotalElements() === 0 ? 0 : this.modalPage() * this.modalPageSize() + 1
  );

  /** Showing to index. */
  readonly modalShowingTo = computed(() =>
    Math.min((this.modalPage() + 1) * this.modalPageSize(), this.modalTotalElements())
  );

  /** Number of actions selected in modal. */
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

  /** Whether all actions on the current page are selected. */
  get allPageActionsSelected(): boolean {
    const currentPage = this.modalPageActions();
    return currentPage.length > 0 && currentPage.every(a => this.modalSelectedIds().includes(a.id));
  }

  // ─── CVA Callbacks ─────────────────────────────────────────

  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    // Load actions if not already triggered by writeValue
    if (this.allActions().length === 0 && !this.loading()) {
      this.loadAllActions();
    }
  }

  // ─── ControlValueAccessor ──────────────────────────────────

  writeValue(value: number[] | null): void {
    this.selectedIds.set(value ?? []);
    // Ensure actions are loaded to resolve IDs to Action objects
    if (this.allActions().length === 0 && (value ?? []).length > 0) {
      this.loadAllActions();
    }
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
   * Removes an action from the selected list.
   */
  removeAction(action: Action): void {
    const updated = this.selectedIds().filter(id => id !== action.id);
    this.selectedIds.set(updated);
    this.onChange(updated);
    this.onTouched();
  }

  // ─── Modal Actions ─────────────────────────────────────────

  /**
   * Opens the selection modal.
   */
  openModal(): void {
    if (this.disabled()) {
      return;
    }
    this.modalSelectedIds.set([...this.selectedIds()]);
    this.modalSearch.set('');
    this.modalPage.set(0);
    this.modalOpen.set(true);
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
  }

  /**
   * Toggles an action in the modal selection.
   */
  toggleModalAction(actionId: number): void {
    this.modalSelectedIds.update(ids => {
      if (ids.includes(actionId)) {
        return ids.filter(id => id !== actionId);
      }
      return [...ids, actionId];
    });
  }

  /**
   * Checks if an action is selected in the modal.
   */
  isModalActionSelected(actionId: number): boolean {
    return this.modalSelectedIds().includes(actionId);
  }

  /**
   * Toggles all actions on the current page.
   */
  toggleAllModalActions(): void {
    const currentPage = this.modalPageActions();
    const allSelected = currentPage.every(a => this.modalSelectedIds().includes(a.id));
    if (allSelected) {
      this.modalSelectedIds.update(ids => ids.filter(id => !currentPage.some(a => a.id === id)));
    } else {
      this.modalSelectedIds.update(ids => {
        const newIds = [...ids];
        currentPage.forEach(a => { if (!newIds.includes(a.id)) newIds.push(a.id); });
        return newIds;
      });
    }
  }

  /**
   * Navigates to a page in the modal.
   */
  modalGoToPage(page: number): void {
    if (page >= 0 && page < this.modalTotalPages()) {
      this.modalPage.set(page);
    }
  }

  /**
   * Handles search text change in the modal (resets to page 0).
   */
  onModalSearchChange(value: string): void {
    this.modalSearch.set(value);
    this.modalPage.set(0);
  }

  /**
   * Handles page size change in the modal.
   */
  onModalPageSizeChange(size: number): void {
    this.modalPageSize.set(size);
    this.modalPage.set(0);
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Returns the CSS classes for the action type badge.
   */
  getTypeBadgeClasses(type: string): string {
    switch (type?.toUpperCase()) {
      case 'READ':
        return 'bg-info-subtle text-info';
      case 'WRITE':
        return 'bg-warning-subtle text-warning';
      case 'EXECUTE':
        return 'bg-success-subtle text-success';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }

  // ─── Private ───────────────────────────────────────────────

  /**
   * Loads all available actions from the backend.
   */
  private loadAllActions(): void {
    if (this.loading()) {
      return; // Already loading
    }
    this.loading.set(true);
    this.profileService.findAllActions().subscribe({
      next: (page) => {
        this.allActions.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
