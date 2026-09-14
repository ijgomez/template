import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpDataListComponent } from './data-list.component';

interface Item {
  id: number;
  name: string;
}

describe('TpDataListComponent', () => {
  let component: TpDataListComponent<Item>;
  let fixture: ComponentFixture<TpDataListComponent<Item>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TpDataListComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent<TpDataListComponent<Item>>(TpDataListComponent);
    component = fixture.componentInstance;
    component.data = [{ id: 1, name: 'A' }];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('pagination getters', () => {
    beforeEach(() => {
      component.totalElements = 42;
      component.pageSize = 10;
      component.currentPage = 2;
    });

    it('totalPages should ceil totalElements / pageSize', () => {
      expect(component.totalPages).toBe(5);
    });

    it('showingFrom / showingTo should reflect the current page window', () => {
      expect(component.showingFrom).toBe(21);
      expect(component.showingTo).toBe(30);
    });

    it('should report 0 when there are no elements', () => {
      component.totalElements = 0;
      expect(component.showingFrom).toBe(0);
      expect(component.totalPages).toBe(0);
    });

    it('visiblePages should cap at 5 pages', () => {
      component.totalElements = 200;
      component.currentPage = 10;
      expect(component.visiblePages.length).toBe(5);
      expect(component.visiblePages).toContain(10);
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.totalElements = 30;
      component.pageSize = 10;
    });

    it('should emit pageChange for a valid page', () => {
      let page: number | undefined;
      component.pageChange.subscribe((p) => (page = p));
      component.goToPage(2);
      expect(page).toBe(2);
    });

    it('should not emit for an out-of-range page', () => {
      let called = false;
      component.pageChange.subscribe(() => (called = true));
      component.goToPage(-1);
      component.goToPage(5);
      expect(called).toBe(false);
    });
  });

  it('onPageSizeChange should emit pageSizeChange', () => {
    let size: number | undefined;
    component.pageSizeChange.subscribe((s) => (size = s));
    component.onPageSizeChange(20);
    expect(size).toBe(20);
  });

  it('onFilterChange should update filterText and emit filterChange', () => {
    let emitted: string | undefined;
    component.filterChange.subscribe((v) => (emitted = v));
    component.onFilterChange('abc');
    expect(component.filterText).toBe('abc');
    expect(emitted).toBe('abc');
  });

  it('onAdd should emit the add event', () => {
    let called = false;
    component.add.subscribe(() => (called = true));
    component.onAdd();
    expect(called).toBe(true);
  });

  it('onRemove should emit the removed item', () => {
    let removed: Item | undefined;
    component.remove.subscribe((i) => (removed = i));
    component.onRemove({ id: 7, name: 'G' });
    expect(removed).toEqual({ id: 7, name: 'G' });
  });
});
