import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ParameterService } from './parameter.service';
import { Parameter, ParameterCriteria } from '../models/parameter.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('ParameterService', () => {
  let service: ParameterService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/parameters`;

  const mockParameter: Parameter = {
    id: 1,
    code: 'MAX_LOGIN_ATTEMPTS',
    description: 'Maximum login attempts',
    value: '5',
    type: 'INTEGER',
    createdAt: '2026-01-01T10:00:00Z',
    lastModifiedAt: '2026-01-02T10:00:00Z',
  };

  const mockPage: Page<Parameter> = {
    content: [mockParameter],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ParameterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findByCriteria', () => {
    it('should GET with pagination params only when criteria is empty', () => {
      service.findByCriteria({}, 0, 20).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('code')).toBeNull();
      req.flush(mockPage);
    });

    it('should include sort and all filter params when provided', () => {
      const criteria: ParameterCriteria = {
        code: 'MAX',
        description: 'desc',
        type: 'STRING',
      };

      service.findByCriteria(criteria, 2, 5, 'code,desc').subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('5');
      expect(req.request.params.get('sort')).toBe('code,desc');
      expect(req.request.params.get('code')).toBe('MAX');
      expect(req.request.params.get('description')).toBe('desc');
      expect(req.request.params.get('type')).toBe('STRING');
      req.flush(mockPage);
    });
  });

  describe('findAllByCriteria', () => {
    it('should request a large page size and return only the content array', () => {
      service.findAllByCriteria({ type: 'INTEGER' }).subscribe((params) => {
        expect(params).toEqual([mockParameter]);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('type')).toBe('INTEGER');
      req.flush(mockPage);
    });
  });

  describe('countByCriteria', () => {
    it('should GET the count endpoint with filter params', () => {
      service.countByCriteria({ code: 'MAX', description: 'd', type: 'BOOLEAN' }).subscribe((count) => {
        expect(count).toBe(7);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('code')).toBe('MAX');
      expect(req.request.params.get('description')).toBe('d');
      expect(req.request.params.get('type')).toBe('BOOLEAN');
      req.flush(7);
    });
  });

  describe('findByCode', () => {
    it('should GET a single parameter by code', () => {
      service.findByCode('MAX_LOGIN_ATTEMPTS').subscribe((p) => {
        expect(p).toEqual(mockParameter);
      });

      const req = httpMock.expectOne(`${baseUrl}/MAX_LOGIN_ATTEMPTS`);
      expect(req.request.method).toBe('GET');
      req.flush(mockParameter);
    });

    it('should URL-encode codes with special characters', () => {
      service.findByCode('a/b c').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent('a/b c')}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockParameter);
    });
  });

  describe('create', () => {
    it('should POST the parameter to the base URL', () => {
      service.create(mockParameter).subscribe((p) => {
        expect(p).toEqual(mockParameter);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockParameter);
      req.flush(mockParameter);
    });
  });

  describe('update', () => {
    it('should PUT the parameter to the code-specific URL', () => {
      service.update('MAX_LOGIN_ATTEMPTS', mockParameter).subscribe((p) => {
        expect(p).toEqual(mockParameter);
      });

      const req = httpMock.expectOne(`${baseUrl}/MAX_LOGIN_ATTEMPTS`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockParameter);
      req.flush(mockParameter);
    });
  });

  describe('delete', () => {
    it('should DELETE the code-specific URL', () => {
      service.delete('MAX_LOGIN_ATTEMPTS').subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/MAX_LOGIN_ATTEMPTS`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
