import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TpSelectedReportsComponent } from './selected-reports.component';
import { ReportService } from '../../../core/services/report.service';
import { Report } from '../../../core/models/report.model';
import { Page } from '../../../core/models/page.model';

/** Builds a Report with sensible defaults. */
function report(id: number, overrides: Partial<Report> = {}): Report {
  return {
    id,
    name: `Report ${id}`,
    description: `Description ${id}`,
    ...overrides,
  };
}

/** Wraps a list of reports in a Spring-style Page. */
function pageOf(reports: Report[], totalElements = reports.length): Page<Report> {
  return {
    content: reports,
    page: { size: 5, number: 0, totalElements, totalPages: Math.ceil(totalElements / 5) || 1 },
  };
}

describe('TpSelectedReportsComponent', () => {
  let component: TpSelectedReportsComponent;
  let fixture: ComponentFixture<TpSelectedReportsComponent>;
  let reportService: {
    findAll: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
  };

  const allReports: Report[] = [
    report(1, { name: 'Alpha' }),
    report(2, { name: 'Beta' }),
    report(3, { name: 'Gamma' }),
  ];

  beforeEach(async () => {
    reportService = {
      findAll: vi.fn().mockReturnValue(of(allReports)),
      search: vi.fn().mockReturnValue(of(pageOf(allReports, 12))),
    };

    await TestBed.configureTestingModule({
      imports: [TpSelectedReportsComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ReportService, useValue: reportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TpSelectedReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadSelectedReports (no-op with empty selection)
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call findAll on init when there is no selection', () => {
    expect(reportService.findAll).not.toHaveBeenCalled();
  });

  // ─── ControlValueAccessor ───────────────────────────────────

  describe('ControlValueAccessor', () => {
    it('writeValue should set selectedIds and load reports to resolve names', () => {
      component.writeValue([1, 2]);
      expect(component.selectedIds()).toEqual([1, 2]);
      expect(reportService.findAll).toHaveBeenCalled();
      expect(component.selectedReports().map(r => r.id)).toEqual([1, 2]);
    });

    it('writeValue should default to [] on null', () => {
      component.writeValue(null);
      expect(component.selectedIds()).toEqual([]);
    });

    it('setDisabledState should update the disabled signal', () => {
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
    });

    it('registerOnChange should be invoked when a report is removed', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);
      component.writeValue([1, 2]);
      component.removeReport(report(1));
      expect(onChange).toHaveBeenCalledWith([2]);
    });
  });

  // ─── loadSelectedReports caching / errors ───────────────────

  describe('loadSelectedReports', () => {
    it('should not re-fetch when all selected IDs are already cached', () => {
      component.writeValue([1]);
      expect(reportService.findAll).toHaveBeenCalledTimes(1);
      component.writeValue([1]);
      // still cached -> no extra call
      expect(reportService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should set loading false when findAll fails', () => {
      reportService.findAll.mockReturnValue(throwError(() => new Error('boom')));
      component.writeValue([1]);
      expect(component.loading()).toBe(false);
    });
  });

  // ─── Selected list computed ─────────────────────────────────

  describe('selected list', () => {
    beforeEach(() => component.writeValue([1, 2, 3]));

    it('selectedReports should resolve IDs from cache', () => {
      expect(component.selectedReports().map(r => r.id)).toEqual([1, 2, 3]);
    });

    it('totalCount should reflect the number of selected IDs', () => {
      expect(component.totalCount()).toBe(3);
    });

    it('filteredSelectedReports should filter by name (case-insensitive)', () => {
      component.onFilterChange('beta');
      expect(component.filteredSelectedReports().map(r => r.id)).toEqual([2]);
    });

    it('filteredSelectedReports should return all when filter is empty', () => {
      component.onFilterChange('');
      expect(component.filteredSelectedReports().length).toBe(3);
    });

    it('removeReport should drop the report from the selection', () => {
      component.removeReport(report(2));
      expect(component.selectedIds()).toEqual([1, 3]);
    });
  });

  // ─── Modal ──────────────────────────────────────────────────

  describe('modal', () => {
    it('openModal should reset state and load the first page', () => {
      component.writeValue([2]);
      reportService.search.mockClear();
      component.openModal();
      expect(component.modalOpen()).toBe(true);
      expect(component.modalSelectedIds()).toEqual([2]);
      expect(component.modalSearch()).toBe('');
      expect(component.modalPage()).toBe(0);
      expect(reportService.search).toHaveBeenCalledWith('', 0, 5);
      expect(component.modalReports().length).toBe(3);
      expect(component.modalTotalElements()).toBe(12);
    });

    it('openModal should do nothing when disabled', () => {
      component.setDisabledState(true);
      component.openModal();
      expect(component.modalOpen()).toBe(false);
    });

    it('closeModal should close without changing the selection', () => {
      component.writeValue([1]);
      component.openModal();
      component.toggleModalReport(2);
      component.closeModal();
      expect(component.modalOpen()).toBe(false);
      expect(component.selectedIds()).toEqual([1]);
    });

    it('confirmSelection should apply the modal selection to the form value', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);
      component.openModal();
      component.toggleModalReport(1);
      component.toggleModalReport(3);
      component.confirmSelection();
      expect(component.selectedIds()).toEqual([1, 3]);
      expect(onChange).toHaveBeenCalledWith([1, 3]);
      expect(component.modalOpen()).toBe(false);
    });

    it('toggleModalReport should add and remove a report', () => {
      component.toggleModalReport(5);
      expect(component.isModalReportSelected(5)).toBe(true);
      component.toggleModalReport(5);
      expect(component.isModalReportSelected(5)).toBe(false);
    });

    it('modalSelectedCount should reflect the modal selection size', () => {
      component.toggleModalReport(1);
      component.toggleModalReport(2);
      expect(component.modalSelectedCount()).toBe(2);
    });

    it('modalGoToPage should fetch the requested page when in range', () => {
      component.openModal();
      reportService.search.mockClear();
      component.modalGoToPage(1);
      expect(component.modalPage()).toBe(1);
      expect(reportService.search).toHaveBeenCalledWith('', 1, 5);
    });

    it('modalGoToPage should ignore out-of-range pages', () => {
      component.openModal();
      reportService.search.mockClear();
      component.modalGoToPage(-1);
      component.modalGoToPage(99);
      expect(component.modalPage()).toBe(0);
      expect(reportService.search).not.toHaveBeenCalled();
    });

    it('onModalSearchChange should reset the page and re-fetch', () => {
      component.openModal();
      component.modalGoToPage(1);
      reportService.search.mockClear();
      component.onModalSearchChange('alpha');
      expect(component.modalSearch()).toBe('alpha');
      expect(component.modalPage()).toBe(0);
      expect(reportService.search).toHaveBeenCalledWith('alpha', 0, 5);
    });

    it('onModalPageSizeChange should update size, reset page and re-fetch', () => {
      component.openModal();
      reportService.search.mockClear();
      component.onModalPageSizeChange(10);
      expect(component.modalPageSize()).toBe(10);
      expect(component.modalPage()).toBe(0);
      expect(reportService.search).toHaveBeenCalledWith('', 0, 10);
    });

    it('should set modalLoading false when search fails', () => {
      reportService.search.mockReturnValue(throwError(() => new Error('boom')));
      component.openModal();
      expect(component.modalLoading()).toBe(false);
    });
  });

  // ─── Modal pagination computed ──────────────────────────────

  describe('modal pagination', () => {
    beforeEach(() => component.openModal());

    it('modalTotalPages should ceil totalElements / pageSize', () => {
      expect(component.modalTotalPages()).toBe(3); // 12 / 5 -> 3
    });

    it('modalShowingFrom / modalShowingTo should reflect the page window', () => {
      expect(component.modalShowingFrom()).toBe(1);
      expect(component.modalShowingTo()).toBe(5);
    });

    it('modalShowingFrom should be 0 when there are no elements', () => {
      reportService.search.mockReturnValue(of(pageOf([], 0)));
      component.onModalSearchChange('none');
      expect(component.modalTotalElements()).toBe(0);
      expect(component.modalShowingFrom()).toBe(0);
      expect(component.modalTotalPages()).toBe(1);
    });

    it('modalVisiblePages should cap at 5 pages for large sets', () => {
      reportService.search.mockReturnValue(of(pageOf(allReports, 100)));
      component.onModalSearchChange('big');
      component.modalGoToPage(10);
      expect(component.modalVisiblePages().length).toBe(5);
      expect(component.modalVisiblePages()).toContain(10);
    });
  });

  // ─── Select-all on page ─────────────────────────────────────

  describe('toggleAllModalReports', () => {
    beforeEach(() => component.openModal());

    it('should select every report on the current page', () => {
      component.toggleAllModalReports();
      expect(component.allPageReportsSelected).toBe(true);
      expect(component.modalSelectedIds()).toEqual([1, 2, 3]);
    });

    it('should deselect every report on the current page when all are selected', () => {
      component.toggleAllModalReports();
      component.toggleAllModalReports();
      expect(component.allPageReportsSelected).toBe(false);
      expect(component.modalSelectedIds()).toEqual([]);
    });
  });
});
