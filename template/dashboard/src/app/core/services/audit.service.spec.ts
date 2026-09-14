import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuditService } from './audit.service';
import { AuditLog } from '../models/audit.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/audit`;

  const mockLog: AuditLog = {
    id: 1,
    timestamp: '2026-01-01T00:00:00Z',
    username: 'admin',
    operationType: 'CREATE',
    section: 'SECURITY',
    entityId: '10',
    entityName: 'User',
    detail: 'Created user',
  };

  const mockPage: Page<AuditLog> = {
    content: [mockLog],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findByCriteria', () => {
    it('should GET with pagination only when criteria is empty', () => {
      service.findByCriteria({}, 0, 20).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('username')).toBeNull();
      req.flush(mockPage);
    });

    it('should include sort and all filter params when provided', () => {
      service
        .findByCriteria(
          {
            dateFrom: '2026-01-01',
            dateTo: '2026-01-31',
            username: 'admin',
            operationType: 'UPDATE',
            section: 'REPORTS',
          },
          1,
          10,
          'timestamp,desc',
        )
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('timestamp,desc');
      expect(req.request.params.get('dateFrom')).toBe('2026-01-01');
      expect(req.request.params.get('dateTo')).toBe('2026-01-31');
      expect(req.request.params.get('username')).toBe('admin');
      expect(req.request.params.get('operationType')).toBe('UPDATE');
      expect(req.request.params.get('section')).toBe('REPORTS');
      req.flush(mockPage);
    });
  });

  describe('findAllByCriteria', () => {
    it('should request a large page size and return only the content array', () => {
      service.findAllByCriteria({ username: 'admin' }).subscribe((logs) => {
        expect(logs).toEqual([mockLog]);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('username')).toBe('admin');
      req.flush(mockPage);
    });
  });

  describe('countByCriteria', () => {
    it('should GET the count endpoint with filter params', () => {
      service.countByCriteria({ section: 'CLUSTER', operationType: 'DELETE' }).subscribe((count) => {
        expect(count).toBe(11);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('section')).toBe('CLUSTER');
      expect(req.request.params.get('operationType')).toBe('DELETE');
      req.flush(11);
    });
  });
});
