import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryList } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';

import { TpDataTableComponent } from './data-table.component';
import { ColumnDef } from './models/column-def.model';

interface Row {
  id: number;
  name: string;
}

/**
 * Minimal DragEvent stub. jsdom does not implement DragEvent, and onDrop only
 * calls preventDefault(), so a stub with that method is sufficient.
 */
function dropEvent(): DragEvent {
  return { preventDefault: () => undefined } as unknown as DragEvent;
}

describe('TpDataTableComponent', () => {
  let component: TpDataTableComponent<Row>;
  let fixture: ComponentFixture<TpDataTableComponent<Row>>;

  const columns: ColumnDef[] = [
    { key: 'id', header: 'col.id', sortable: true, reorderable: true, width: '80px' },
    { key: 'name', header: 'col.name', sortable: true, reorderable: true },
    { key: 'actions', header: 'col.actions' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TpDataTableComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent<TpDataTableComponent<Row>>(TpDataTableComponent);
    component = fixture.componentInstance;
    component.columns = columns.map((c) => ({ ...c }));
    component.data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise pixel column widths from ColumnDef on init', () => {
    expect(component.columnWidths['id']).toBe(80);
    expect(component.columnWidths['name']).toBeUndefined();
  });

  describe('pagination getters', () => {
    beforeEach(() => {
      component.totalElements = 23;
      component.pageSize = 10;
      component.currentPage = 1;
    });

    it('totalPages should ceil totalElements / pageSize', () => {
      expect(component.totalPages).toBe(3);
    });

    it('showingFrom / showingTo should reflect the current page window', () => {
      expect(component.showingFrom).toBe(11);
      expect(component.showingTo).toBe(20);
    });

    it('showingFrom should be 0 when there are no elements', () => {
      component.totalElements = 0;
      expect(component.showingFrom).toBe(0);
      expect(component.totalPages).toBe(0);
    });

    it('visiblePages should cap at 5 pages centered on the current page', () => {
      component.totalElements = 100;
      component.pageSize = 10;
      component.currentPage = 5;
      expect(component.visiblePages.length).toBe(5);
      expect(component.visiblePages).toContain(5);
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.totalElements = 30;
      component.pageSize = 10;
    });

    it('should emit pageChange for a valid page', () => {
      let emitted: number | undefined;
      component.pageChange.subscribe((p) => (emitted = p));
      component.goToPage(2);
      expect(emitted).toBe(2);
    });

    it('should not emit for an out-of-range page', () => {
      let called = false;
      component.pageChange.subscribe(() => (called = true));
      component.goToPage(-1);
      component.goToPage(3);
      expect(called).toBe(false);
    });
  });

  it('onPageSizeChange should emit pageSizeChange', () => {
    let size: number | undefined;
    component.pageSizeChange.subscribe((s) => (size = s));
    component.onPageSizeChange(50);
    expect(size).toBe(50);
  });

  describe('sorting', () => {
    it('should cycle asc → desc → none on the same column', () => {
      const col = component.columns[0];
      const events: string[] = [];
      component.sortChange.subscribe((e) => events.push(`${e.column}:${e.direction}`));

      component.onSortColumn(col);
      expect(component.sortDirection).toBe('asc');

      component.onSortColumn(col);
      expect(component.sortDirection).toBe('desc');

      component.onSortColumn(col);
      expect(component.sortDirection).toBe('');
      expect(component.sortColumn).toBe('');

      expect(events).toEqual(['id:asc', 'id:desc', ':']);
    });

    it('should start at asc when switching to a different column', () => {
      component.onSortColumn(component.columns[0]);
      component.onSortColumn(component.columns[0]);
      expect(component.sortDirection).toBe('desc');

      component.onSortColumn(component.columns[1]);
      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('should ignore clicks on non-sortable columns', () => {
      let called = false;
      component.sortChange.subscribe(() => (called = true));
      component.onSortColumn(component.columns[2]);
      expect(called).toBe(false);
    });

    it('getAriaSort should reflect the current sort state', () => {
      const col = component.columns[0];
      expect(component.getAriaSort(col)).toBe('none');
      component.onSortColumn(col);
      expect(component.getAriaSort(col)).toBe('ascending');
      component.onSortColumn(col);
      expect(component.getAriaSort(col)).toBe('descending');
      expect(component.getAriaSort(component.columns[2])).toBe('none');
    });
  });

  describe('selection', () => {
    it('isSelected should compare by id', () => {
      component.selectedItem = { id: 1, name: 'Alice' };
      expect(component.isSelected({ id: 1, name: 'Alice' })).toBe(true);
      expect(component.isSelected({ id: 2, name: 'Bob' })).toBe(false);
    });

    it('onRowClick should emit rowSelect when selectable', () => {
      let selected: Row | undefined;
      component.rowSelect.subscribe((r) => (selected = r));
      component.onRowClick({ id: 2, name: 'Bob' });
      expect(selected).toEqual({ id: 2, name: 'Bob' });
    });

    it('onRowClick should not emit when not selectable', () => {
      component.selectable = false;
      let called = false;
      component.rowSelect.subscribe(() => (called = true));
      component.onRowClick({ id: 1, name: 'Alice' });
      expect(called).toBe(false);
    });

    it('onRowDoubleClick should emit rowDoubleClick', () => {
      let dbl: Row | undefined;
      component.rowDoubleClick.subscribe((r) => (dbl = r));
      component.onRowDoubleClick({ id: 1, name: 'Alice' });
      expect(dbl).toEqual({ id: 1, name: 'Alice' });
    });
  });

  describe('getCellValue', () => {
    it('should return the property value', () => {
      expect(component.getCellValue({ id: 5, name: 'Eve' }, 'name')).toBe('Eve');
    });

    it('should return empty string for a missing property', () => {
      expect(component.getCellValue({ id: 5, name: 'Eve' }, 'missing')).toBe('');
    });
  });

  describe('getColumnStyle', () => {
    it('should use the runtime pixel width when present', () => {
      component.columnWidths['name'] = 200;
      expect(component.getColumnStyle({ key: 'name', header: 'x' })).toEqual({
        width: '200px',
        minWidth: '200px',
        maxWidth: '200px',
      });
    });

    it('should fall back to the ColumnDef width', () => {
      expect(component.getColumnStyle({ key: 'x', header: 'x', width: '30%' })).toEqual({ width: '30%' });
    });

    it('should return empty object when no width is defined', () => {
      expect(component.getColumnStyle({ key: 'x', header: 'x' })).toEqual({});
    });
  });

  describe('column reordering', () => {
    it('onDrop should move the dragged column and emit the new order', () => {
      let reordered: ColumnDef[] | undefined;
      component.columnsReorder.subscribe((cols) => (reordered = cols));

      component.dragColumnKey = 'id';
      const target = component.columns[1]; // 'name'
      component.onDrop(dropEvent(), target);

      expect(component.columns.map((c) => c.key)).toEqual(['name', 'id', 'actions']);
      expect(reordered?.map((c) => c.key)).toEqual(['name', 'id', 'actions']);
      expect(component.dragColumnKey).toBeNull();
    });

    it('onDrop should not reorder when dropping on the same column', () => {
      let called = false;
      component.columnsReorder.subscribe(() => (called = true));
      component.dragColumnKey = 'id';
      component.onDrop(dropEvent(), component.columns[0]);
      expect(called).toBe(false);
      expect(component.columns.map((c) => c.key)).toEqual(['id', 'name', 'actions']);
    });

    it('onDragStart should set drag metadata and prevent default when reorderable', () => {
      const event = { preventDefault: vi.fn(), dataTransfer: { effectAllowed: '', setData: vi.fn() } } as unknown as DragEvent;
      component.onDragStart(event, component.columns[0]);

      expect(component.dragColumnKey).toBe('id');
      expect((event.dataTransfer as DataTransfer).setData).toHaveBeenCalledWith('text/plain', 'id');
      expect(component.dragOverColumnKey).toBeNull();
    });

    it('onDragStart should ignore non-reorderable columns and prevent default', () => {
      const event = { preventDefault: vi.fn() } as unknown as DragEvent;
      component.onDragStart(event, component.columns[2]);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.dragColumnKey).toBeNull();
    });

    it('onDragOver should allow dropping and mark the hovered column', () => {
      const event = { preventDefault: vi.fn(), dataTransfer: { dropEffect: '' } } as unknown as DragEvent;
      component.dragColumnKey = 'id';
      component.onDragOver(event, component.columns[1]);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.dragOverColumnKey).toBe('name');
      expect((event.dataTransfer as DataTransfer).dropEffect).toBe('move');
    });

    it('onDragLeave should clear the hover target state', () => {
      component.dragOverColumnKey = 'name';
      component.onDragLeave(component.columns[1]);
      expect(component.dragOverColumnKey).toBeNull();
    });

    it('onResizeStart should update runtime widths and emit when mouseup fires', () => {
      const col = component.columns[0];
      col.resizable = true;
      const th = document.createElement('th');
      Object.defineProperty(th, 'offsetWidth', { value: 140, configurable: true });
      const event = { clientX: 100, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent;
      let emitted: { column: string; width: number } | undefined;
      component.columnResize.subscribe((value) => (emitted = value));

      component.onResizeStart(event, col, th);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.body.classList.contains('tp-table-resizing')).toBe(true);

      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 160 }));
      expect(component.columnWidths['id']).toBe(200);

      document.dispatchEvent(new MouseEvent('mouseup'));
      expect(emitted).toEqual({ column: 'id', width: 200 });
      expect(document.body.classList.contains('tp-table-resizing')).toBe(false);
    });

    it('getColumnTemplate should return the matching template directive', () => {
      const directive = { tpColumn: 'name' } as any;
      const templateList = new QueryList<any>();
      templateList.reset([directive]);
      component.columnTemplates = templateList;
      expect(component.getColumnTemplate('name')).toBe(directive);
      expect(component.getColumnTemplate('id')).toBeUndefined();
    });

    it('onDragEnd should reset drag state', () => {
      component.dragColumnKey = 'id';
      component.dragOverColumnKey = 'name';
      component.onDragEnd();
      expect(component.dragColumnKey).toBeNull();
      expect(component.dragOverColumnKey).toBeNull();
    });
  });
});
