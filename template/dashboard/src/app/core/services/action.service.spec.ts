import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ActionService } from './action.service';
import { Action, ActionCriteria } from '../../features/administration/security/actions/models/action.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('ActionService', () => {
  let service: ActionService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/security/actions`;

  const mockAction: Action = {
    id: 1,
    code: 'USER_READ',
    type: 'READ',
    name: 'Read users',
    description: 'Allows reading users',
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  };

  const mockPage: Page<Action> = {
    content: [mockAction],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ActionService);
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
      expect(req.request.params.get('code')).toBeNull();
      req.flush(mockPage);
    });

    it('should include sort and all filter params when provided', () => {
      const criteria: ActionCriteria = { code: 'USER', name: 'Read', type: 'READ' };

      service.findByCriteria(criteria, 1, 10, 'code,asc').subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('code,asc');
      expect(req.request.params.get('code')).toBe('USER');
      expect(req.request.params.get('name')).toBe('Read');
      expect(req.request.params.get('type')).toBe('READ');
      req.flush(mockPage);
    });
  });

  describe('findAllByCriteria', () => {
    it('should request a large page size and return only the content array', () => {
      service.findAllByCriteria({ type: 'READ' }).subscribe((actions) => {
        expect(actions).toEqual([mockAction]);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('type')).toBe('READ');
      req.flush(mockPage);
    });
  });

  describe('countByCriteria', () => {
    it('should GET the count endpoint with filter params', () => {
      service.countByCriteria({ code: 'USER', name: 'Read', type: 'READ' }).subscribe((count) => {
        expect(count).toBe(4);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('code')).toBe('USER');
      expect(req.request.params.get('name')).toBe('Read');
      expect(req.request.params.get('type')).toBe('READ');
      req.flush(4);
    });
  });

  describe('findById', () => {
    it('should GET a single action by id', () => {
      service.findById(1).subscribe((action) => {
        expect(action).toEqual(mockAction);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAction);
    });
  });

  describe('update', () => {
    it('should PUT the partial action to the id-specific URL', () => {
      const patch = { name: 'New name' };

      service.update(1, patch).subscribe((action) => {
        expect(action).toEqual(mockAction);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(patch);
      req.flush(mockAction);
    });
  });
});
