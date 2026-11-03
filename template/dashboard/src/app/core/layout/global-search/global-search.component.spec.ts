import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchResultGroup } from '../../models/global-search.model';
import { GlobalSearchService } from '../../services/global-search.service';
import { GlobalSearchComponent } from './global-search.component';

const userGroup: SearchResultGroup = {
  type: 'user',
  labelKey: 'globalSearch.groups.user',
  totalMatches: 8,
  seeAllRoute: '/administration/security/users',
  seeAllQueryParams: { username: 'ad' },
  items: [
    { type: 'user', id: 1, primary: 'admin', secondary: 'ADMIN', route: '/administration/security/users', queryParams: { view: 'detail', id: '1' } },
    { type: 'user', id: 2, primary: 'adam', secondary: 'USER', route: '/administration/security/users', queryParams: { view: 'detail', id: '2' } },
  ],
};

const paramGroup: SearchResultGroup = {
  type: 'parameter',
  labelKey: 'globalSearch.groups.parameter',
  totalMatches: 1,
  seeAllRoute: '/administration/parameters',
  seeAllQueryParams: {},
  items: [
    { type: 'parameter', id: 9, primary: 'ad.code', route: '/administration/parameters', queryParams: { view: 'detail', id: '9' } },
  ],
};

describe('GlobalSearchComponent', () => {
  let fixture: ComponentFixture<GlobalSearchComponent>;
  let searchMock: ReturnType<typeof vi.fn>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const q = (testid: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  const qAll = (testid: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testid}"]`));
  const input = (): HTMLInputElement => q('input-global-search') as HTMLInputElement;

  function type(value: string): void {
    const el = input();
    el.value = value;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function key(k: string): KeyboardEvent {
    const ev = new KeyboardEvent('keydown', { key: k, cancelable: true, bubbles: true });
    input().dispatchEvent(ev);
    fixture.detectChanges();
    return ev;
  }

  /** Types a term and lets the debounce elapse so the search is executed. */
  function search(value = 'ad'): void {
    type(value);
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    searchMock = vi.fn().mockReturnValue(of([userGroup, paramGroup]));
    routerMock = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [GlobalSearchComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: GlobalSearchService, useValue: { search: searchMock } },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalSearchComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce and minimum characters', () => {
    it('should not search before 300ms have elapsed', () => {
      type('ad');
      vi.advanceTimersByTime(299);
      expect(searchMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(searchMock).toHaveBeenCalledTimes(1);
      expect(searchMock).toHaveBeenCalledWith('ad');
    });

    it('should search only once with the last value when typing quickly', () => {
      type('a');
      vi.advanceTimersByTime(100);
      type('ad');
      vi.advanceTimersByTime(100);
      type('adm');
      vi.advanceTimersByTime(300);

      expect(searchMock).toHaveBeenCalledTimes(1);
      expect(searchMock).toHaveBeenCalledWith('adm');
    });

    it('should not search with fewer than 2 characters', () => {
      type('a');
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();

      expect(searchMock).not.toHaveBeenCalled();
      expect(q('global-search-popup')).toBeNull();
    });

    it('should trim the term before searching', () => {
      search('  ad  ');
      expect(searchMock).toHaveBeenCalledWith('ad');
    });
  });

  describe('group rendering', () => {
    beforeEach(() => search());

    it('should render a group per entity with header, count and results', () => {
      expect(q('global-search-group-user')).not.toBeNull();
      expect(q('global-search-group-parameter')).not.toBeNull();
      expect(q('global-search-count-user')?.textContent?.trim()).toBe('8');
      expect(q('global-search-count-parameter')?.textContent?.trim()).toBe('1');
      expect(q('global-search-group-user')?.textContent).toContain('globalSearch.groups.user');

      const results = qAll('global-search-result');
      expect(results.length).toBe(3);
      expect(results[0].textContent).toContain('admin');
      expect(results[0].textContent).toContain('ADMIN');
    });

    it('should show "see all" only when there are more matches than items', () => {
      expect(q('global-search-see-all-user')).not.toBeNull();
      expect(q('global-search-see-all-parameter')).toBeNull();
    });
  });

  describe('states', () => {
    it('should show loading while the search is pending', () => {
      const pending = new Subject<SearchResultGroup[]>();
      searchMock.mockReturnValue(pending);

      search();

      expect(q('global-search-loading')).not.toBeNull();
      expect(q('global-search-live')?.textContent).toContain('globalSearch.loading');

      pending.next([userGroup]);
      fixture.detectChanges();

      expect(q('global-search-loading')).toBeNull();
      expect(q('global-search-group-user')).not.toBeNull();
    });

    it('should show the empty message when there are no results', () => {
      searchMock.mockReturnValue(of([
        { ...userGroup, items: [], totalMatches: 0 },
        { ...paramGroup, items: [], totalMatches: 0 },
      ]));

      search();

      expect(q('global-search-empty')).not.toBeNull();
      expect(qAll('global-search-result').length).toBe(0);
    });

    it('should show the empty message when the whole search fails', () => {
      const failing = new Subject<SearchResultGroup[]>();
      searchMock.mockReturnValue(failing);
      search();
      failing.error(new Error('boom'));
      fixture.detectChanges();

      expect(q('global-search-loading')).toBeNull();
      expect(q('global-search-empty')).not.toBeNull();
    });

    it('should show an error in the failed group and keep the others', () => {
      searchMock.mockReturnValue(of([
        { ...userGroup, items: [], totalMatches: 0, hasError: true },
        paramGroup,
      ]));

      search();

      expect(q('global-search-error-user')).not.toBeNull();
      expect(q('global-search-error-parameter')).toBeNull();
      expect(q('global-search-empty')).toBeNull();
      expect(qAll('global-search-result').length).toBe(1);
      expect(q('global-search-see-all-user')).toBeNull();
    });
  });

  describe('navigation', () => {
    beforeEach(() => search());

    it('should navigate to the detail and close the popup when clicking a result', () => {
      qAll('global-search-result')[1].click();
      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/administration/security/users'],
        { queryParams: { view: 'detail', id: '2' } },
      );
      expect(q('global-search-popup')).toBeNull();
    });

    it('should navigate to the list and close the popup when clicking "see all"', () => {
      q('global-search-see-all-user')?.click();
      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/administration/security/users'], { queryParams: { username: 'ad' } });
      expect(q('global-search-popup')).toBeNull();
    });

    it('should navigate to the active option with Enter and close the popup', () => {
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/administration/security/users'],
        { queryParams: { view: 'detail', id: '2' } },
      );
      expect(q('global-search-popup')).toBeNull();
    });

    it('should activate "see all" with Enter when it is the active option', () => {
      key('ArrowUp'); // wraps to the last option (parameter result)
      key('ArrowUp'); // previous: see-all of users
      key('Enter');

      expect(routerMock.navigate).toHaveBeenCalledWith(['/administration/security/users'], { queryParams: { username: 'ad' } });
    });

    it('should not navigate with Enter when no option is active', () => {
      key('Enter');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    beforeEach(() => search());

    it('should close with Escape', () => {
      expect(q('global-search-popup')).not.toBeNull();
      key('Escape');
      expect(q('global-search-popup')).toBeNull();
    });

    it('should close when clicking outside', () => {
      document.body.click();
      fixture.detectChanges();
      expect(q('global-search-popup')).toBeNull();
    });

    it('should stay open when clicking inside the component', () => {
      input().click();
      fixture.detectChanges();
      expect(q('global-search-popup')).not.toBeNull();
    });

    it('should close immediately when the input is emptied', () => {
      type('');
      expect(q('global-search-popup')).toBeNull();
    });

    it('should close immediately when the input drops below 2 characters', () => {
      type('a');
      expect(q('global-search-popup')).toBeNull();
    });
  });

  describe('keyboard navigation and ARIA', () => {
    it('should expose combobox, listbox, group and option roles', () => {
      search();

      expect(input().getAttribute('role')).toBe('combobox');
      expect(input().getAttribute('aria-controls')).toBe('global-search-popup');
      expect(input().getAttribute('aria-expanded')).toBe('true');
      expect(q('global-search-popup')?.getAttribute('role')).toBe('listbox');
      expect(q('global-search-group-user')?.getAttribute('role')).toBe('group');
      qAll('global-search-result').forEach((o) => expect(o.getAttribute('role')).toBe('option'));
      expect(q('global-search-see-all-user')?.getAttribute('role')).toBe('option');
      expect(q('global-search-live')?.getAttribute('aria-live')).toBe('polite');
    });

    it('should report aria-expanded false when closed', () => {
      expect(input().getAttribute('aria-expanded')).toBe('false');
      expect(input().getAttribute('aria-activedescendant')).toBeNull();
    });

    it('should move aria-activedescendant with ArrowDown/ArrowUp, including see-all and wrapping', () => {
      search();

      const ev = key('ArrowDown');
      expect(ev.defaultPrevented).toBe(true);
      expect(input().getAttribute('aria-activedescendant')).toBe('global-search-option-0-0');
      expect(qAll('global-search-result')[0].getAttribute('aria-selected')).toBe('true');

      key('ArrowDown');
      key('ArrowDown');
      expect(input().getAttribute('aria-activedescendant')).toBe('global-search-see-all-0');
      expect(q('global-search-see-all-user')?.getAttribute('aria-selected')).toBe('true');

      key('ArrowDown');
      expect(input().getAttribute('aria-activedescendant')).toBe('global-search-option-1-0');

      key('ArrowDown'); // wraps to the first
      expect(input().getAttribute('aria-activedescendant')).toBe('global-search-option-0-0');

      key('ArrowUp'); // wraps to the last
      expect(input().getAttribute('aria-activedescendant')).toBe('global-search-option-1-0');
    });

    it('should mark only the active option as aria-selected="true"', () => {
      search();
      key('ArrowDown');

      const selected = qAll('global-search-result').map((o) => o.getAttribute('aria-selected'));
      expect(selected).toEqual(['true', 'false', 'false']);
      expect(q('global-search-see-all-user')?.getAttribute('aria-selected')).toBe('false');
    });

    it('should give every option a unique id and keep aria-controls pointing to the listbox', () => {
      search();

      const ids = [...qAll('global-search-result'), q('global-search-see-all-user')!].map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.length > 0)).toBe(true);
      expect(q('global-search-popup')?.id).toBe(input().getAttribute('aria-controls'));
    });

    it('should expose aria-autocomplete="list" and an accessible name on the combobox and listbox', () => {
      search();

      expect(input().getAttribute('aria-autocomplete')).toBe('list');
      expect(input().getAttribute('aria-label')).toBeTruthy();
      expect(q('global-search-popup')?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should keep focus on the input while navigating and after Escape', () => {
      document.body.appendChild(fixture.nativeElement);
      search();
      input().focus();

      key('ArrowDown');
      expect(document.activeElement).toBe(input());

      key('Escape');
      expect(q('global-search-popup')).toBeNull();
      expect(document.activeElement).toBe(input());
      expect(input().getAttribute('aria-expanded')).toBe('false');

      fixture.nativeElement.remove();
    });

    it('should clear aria-activedescendant when the popup closes', () => {
      search();
      key('ArrowDown');
      key('Escape');

      expect(input().getAttribute('aria-activedescendant')).toBeNull();
    });
  });
});
