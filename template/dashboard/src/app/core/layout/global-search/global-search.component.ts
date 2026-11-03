import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { SearchResultGroup, SearchResultItem } from '../../models/global-search.model';
import { GlobalSearchService } from '../../services/global-search.service';

/** Debounce applied to the typed term (RF-1, RNF-2). */
export const GLOBAL_SEARCH_DEBOUNCE_MS = 300;
/** Minimum number of characters required to trigger a search (RF-1). */
export const GLOBAL_SEARCH_MIN_CHARS = 2;

/** Keyboard-navigable entry of the popup (a result or a "see all" action). */
export interface GlobalSearchOption {
  id: string;
  group: SearchResultGroup;
  /** Present for result options; absent for the "see all" action. */
  item?: SearchResultItem;
}

/**
 * Global search box of the header: input + grouped results popup.
 * Only handles the view (input, debounce, popup, keyboard, states, navigation);
 * the searches themselves are delegated to {@link GlobalSearchService}.
 */
@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class GlobalSearchComponent {

  readonly popupId = 'global-search-popup';

  private readonly searchService = inject(GlobalSearchService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw text typed by the user. */
  readonly term = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly groups = signal<SearchResultGroup[]>([]);
  /** Term the current results belong to (used in the empty message). */
  readonly searchedTerm = signal('');
  /** Index of the highlighted option, -1 when none. */
  readonly activeIndex = signal(-1);

  /** Flat list of options in display order, used for keyboard navigation. */
  readonly options = computed<GlobalSearchOption[]>(() => {
    const result: GlobalSearchOption[] = [];
    this.groups().forEach((group, gi) => {
      group.items.forEach((item, ii) =>
        result.push({ id: this.optionId(gi, ii), group, item }));
      if (this.showSeeAll(group)) {
        result.push({ id: this.seeAllId(gi), group });
      }
    });
    return result;
  });

  /** True when no group has results and none failed (RF-5). */
  readonly isEmpty = computed(() =>
    !this.loading() && this.groups().every((g) => g.items.length === 0 && !g.hasError));

  readonly activeDescendant = computed(() => this.options()[this.activeIndex()]?.id ?? null);

  constructor() {
    toObservable(this.term).pipe(
      map((value) => value.trim()),
      debounceTime(GLOBAL_SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((value) => {
        if (value.length < GLOBAL_SEARCH_MIN_CHARS) {
          return of({ term: value, groups: null as SearchResultGroup[] | null });
        }
        this.searchedTerm.set(value);
        this.groups.set([]);
        this.activeIndex.set(-1);
        this.loading.set(true);
        this.open.set(true);
        return this.searchService.search(value).pipe(
          map((groups) => ({ term: value, groups: groups as SearchResultGroup[] | null })),
          catchError(() => of({ term: value, groups: [] as SearchResultGroup[] | null })),
        );
      }),
      tap(({ groups }) => {
        if (groups === null) {
          this.close();
          return;
        }
        this.groups.set(groups);
        this.loading.set(false);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.term.set(value);
    // Closing on an empty/short input must be immediate, not debounced (RF-6).
    if (value.trim().length < GLOBAL_SEARCH_MIN_CHARS) {
      this.close();
    }
  }

  onFocus(): void {
    if (this.term().trim().length >= GLOBAL_SEARCH_MIN_CHARS && (this.groups().length > 0 || this.loading())) {
      this.open.set(true);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        if (!this.open()) {
          this.onFocus();
        } else if (count > 0) {
          this.activeIndex.update((i) => (i + 1) % count);
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (this.open() && count > 0) {
          this.activeIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        }
        event.preventDefault();
        break;
      case 'Enter': {
        const option = this.options()[this.activeIndex()];
        if (this.open() && option) {
          event.preventDefault();
          this.activate(option);
        }
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** Navigates to the detail of a result and closes the popup (RF-4, RF-6). */
  openItem(item: SearchResultItem): void {
    this.router.navigate([item.route], { queryParams: item.queryParams });
    this.close();
  }

  /**
   * Navigates to the list of a group, preselecting its text filter through the
   * group's query params, and closes the popup.
   */
  seeAll(group: SearchResultGroup): void {
    this.router.navigate([group.seeAllRoute], { queryParams: group.seeAllQueryParams });
    this.close();
  }

  showSeeAll(group: SearchResultGroup): boolean {
    return !group.hasError && group.totalMatches > group.items.length;
  }

  optionId(groupIndex: number, itemIndex: number): string {
    return `global-search-option-${groupIndex}-${itemIndex}`;
  }

  seeAllId(groupIndex: number): string {
    return `global-search-see-all-${groupIndex}`;
  }

  isActive(id: string): boolean {
    return this.activeDescendant() === id;
  }

  /** Closes the popup and resets the transient state. Focus stays in the input. */
  close(): void {
    this.open.set(false);
    this.loading.set(false);
    this.activeIndex.set(-1);
  }

  private activate(option: GlobalSearchOption): void {
    if (option.item) {
      this.openItem(option.item);
    } else {
      this.seeAll(option.group);
    }
  }
}
