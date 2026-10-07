import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ReportService } from './report.service';
import { Report, ReportFilter, ReportResult } from '../models/report.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/reports`;

  const mockReport: Report = { id: 1, name: 'Sales', description: 'Sales report' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findUserReports', () => {
    it('should GET the base URL', () => {
      service.findUserReports().subscribe((reports) => {
        expect(reports).toEqual([mockReport]);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockReport]);
    });
  });

  describe('findAll', () => {
    it('should GET the /all endpoint', () => {
      service.findAll().subscribe((reports) => {
        expect(reports).toEqual([mockReport]);
      });

      const req = httpMock.expectOne(`${baseUrl}/all`);
      expect(req.request.method).toBe('GET');
      req.flush([mockReport]);
    });
  });

  describe('search', () => {
    it('should GET /search with pagination and no name param when name is empty', () => {
      const page: Page<Report> = {
        content: [mockReport],
        page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
      };

      service.search('', 0, 10).subscribe((res) => {
        expect(res).toEqual(page);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/search`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('name')).toBeNull();
      req.flush(page);
    });

    it('should include name param when provided', () => {
      service.search('Sales', 1, 5).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/search`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('5');
      expect(req.request.params.get('name')).toBe('Sales');
      req.flush({ content: [], page: { size: 5, number: 1, totalElements: 0, totalPages: 0 } });
    });
  });

  describe('getFilters', () => {
    it('should GET the filters for a report', () => {
      const filters: ReportFilter[] = [
        { name: 'date', label: 'Date', type: 'DATE', required: true },
      ];

      service.getFilters(7).subscribe((res) => {
        expect(res).toEqual(filters);
      });

      const req = httpMock.expectOne(`${baseUrl}/7/filters`);
      expect(req.request.method).toBe('GET');
      req.flush(filters);
    });
  });

  describe('execute', () => {
    it('should POST filters to the execute endpoint with pagination params', () => {
      const filters = { date: '2026-01-01' };
      const result: ReportResult = {
        columns: ['a'],
        rows: [{ a: '1' }],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      };

      service.execute(7, filters, 0, 10).subscribe((res) => {
        expect(res).toEqual(result);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/7/execute`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(result);
    });

    it('should normalize legacy paged payload using content/page metadata', () => {
      const filters = { region: 'EU' };
      const legacyResponse = {
        content: [{ code: 'A1', total: 15 }],
        page: { totalElements: 44, totalPages: 5, size: 10, number: 2 },
      };

      service.execute(9, filters, 0, 10).subscribe((res) => {
        expect(res.columns).toEqual(['code', 'total']);
        expect(res.rows).toEqual([{ code: 'A1', total: 15 }]);
        expect(res.totalElements).toBe(44);
        expect(res.totalPages).toBe(5);
        expect(res.size).toBe(10);
        expect(res.number).toBe(2);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/9/execute`);
      req.flush(legacyResponse);
    });

    it('should normalize legacy payload with empty rows and fallback defaults', () => {
      const legacyResponse = {
        content: [],
      };

      service.execute(9, {}, 3, 25).subscribe((res) => {
        expect(res.columns).toEqual([]);
        expect(res.rows).toEqual([]);
        expect(res.totalElements).toBe(0);
        expect(res.totalPages).toBe(1);
        expect(res.size).toBe(25);
        expect(res.number).toBe(3);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/9/execute`);
      req.flush(legacyResponse);
    });
  });

  describe('export', () => {
    it('should POST filters to the format-specific export endpoint expecting a blob', () => {
      const filters = { year: '2026' };
      const blob = new Blob(['data'], { type: 'application/pdf' });

      service.export(7, filters, 'PDF').subscribe((res) => {
        expect(res).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${baseUrl}/7/export/PDF`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });
});
