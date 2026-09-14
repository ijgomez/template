import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { InterfaceService } from './interface.service';
import { InterfaceConfig, InterfaceLog } from '../models/interface.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('InterfaceService', () => {
  let service: InterfaceService;
  let httpMock: HttpTestingController;

  const configUrl = `${environment.apiUrl}/interfaces/configuration`;
  const monitorUrl = `${environment.apiUrl}/interfaces/monitor`;

  const mockConfig: InterfaceConfig = {
    id: 1,
    name: 'ERP',
    description: 'ERP integration',
    url: 'https://erp.example.com',
    protocol: 'HTTPS',
    checkFrequency: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  };

  const mockLog: InterfaceLog = {
    id: 1,
    timestamp: '2026-01-01T00:00:00Z',
    operationType: 'POST',
    interfaceName: 'ERP',
    interfaceId: 1,
    requestPayload: '{}',
    responsePayload: '{}',
    status: 'SUCCESS',
    errorMessage: null,
  };

  const mockLogPage: Page<InterfaceLog> = {
    content: [mockLog],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterfaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('configurations', () => {
    it('findAllConfigurations should GET the config URL', () => {
      service.findAllConfigurations().subscribe((configs) => {
        expect(configs).toEqual([mockConfig]);
      });

      const req = httpMock.expectOne(configUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockConfig]);
    });

    it('findConfigurationById should GET a single config', () => {
      service.findConfigurationById(1).subscribe((config) => {
        expect(config).toEqual(mockConfig);
      });

      const req = httpMock.expectOne(`${configUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });
  });

  describe('logs', () => {
    it('findLogsByCriteria should GET with pagination only when criteria is empty', () => {
      service.findLogsByCriteria({}, 0, 20).subscribe((page) => {
        expect(page).toEqual(mockLogPage);
      });

      const req = httpMock.expectOne((r) => r.url === monitorUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('status')).toBeNull();
      req.flush(mockLogPage);
    });

    it('findLogsByCriteria should include sort and all filter params when provided', () => {
      service
        .findLogsByCriteria(
          {
            dateFrom: '2026-01-01',
            dateTo: '2026-01-31',
            operationType: 'POST',
            interfaceId: 1,
            status: 'ERROR',
          },
          1,
          10,
          'timestamp,desc',
        )
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === monitorUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('timestamp,desc');
      expect(req.request.params.get('dateFrom')).toBe('2026-01-01');
      expect(req.request.params.get('dateTo')).toBe('2026-01-31');
      expect(req.request.params.get('operationType')).toBe('POST');
      expect(req.request.params.get('interfaceId')).toBe('1');
      expect(req.request.params.get('status')).toBe('ERROR');
      req.flush(mockLogPage);
    });

    it('findAllLogsByCriteria should request a large page size and return content', () => {
      service.findAllLogsByCriteria({ status: 'SUCCESS' }).subscribe((logs) => {
        expect(logs).toEqual([mockLog]);
      });

      const req = httpMock.expectOne((r) => r.url === monitorUrl);
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('status')).toBe('SUCCESS');
      req.flush(mockLogPage);
    });

    it('countLogsByCriteria should GET the count endpoint with filter params', () => {
      service.countLogsByCriteria({ interfaceId: 2, status: 'ERROR' }).subscribe((count) => {
        expect(count).toBe(9);
      });

      const req = httpMock.expectOne((r) => r.url === `${monitorUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('interfaceId')).toBe('2');
      expect(req.request.params.get('status')).toBe('ERROR');
      req.flush(9);
    });

    it('findLogById should GET a single log', () => {
      service.findLogById(1).subscribe((log) => {
        expect(log).toEqual(mockLog);
      });

      const req = httpMock.expectOne(`${monitorUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLog);
    });
  });
});
