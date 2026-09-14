import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProfileService } from './profile.service';
import { Action, Profile, ProfileCriteria } from '../../features/administration/security/profiles/models/profile.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/security/profiles`;
  const actionsUrl = `${environment.apiUrl}/administration/security/actions`;

  const mockAction: Action = { id: 1, code: 'USER_READ', type: 'READ', name: 'Read users' };

  const mockProfile: Profile = {
    id: 1,
    name: 'Administrator',
    description: 'Full access',
    actions: [mockAction],
    actionIds: [1],
    createdAt: '2026-01-01T10:00:00Z',
    lastModifiedAt: '2026-01-02T10:00:00Z',
  };

  const mockPage: Page<Profile> = {
    content: [mockProfile],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
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
      expect(req.request.params.get('name')).toBeNull();
      req.flush(mockPage);
    });

    it('should include sort and name filter when provided', () => {
      const criteria: ProfileCriteria = { name: 'Admin' };

      service.findByCriteria(criteria, 1, 10, 'name,asc').subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('name,asc');
      expect(req.request.params.get('name')).toBe('Admin');
      req.flush(mockPage);
    });
  });

  describe('findAllByCriteria', () => {
    it('should request a large page size and return only the content array', () => {
      service.findAllByCriteria({ name: 'Admin' }).subscribe((profiles) => {
        expect(profiles).toEqual([mockProfile]);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('name')).toBe('Admin');
      req.flush(mockPage);
    });
  });

  describe('countByCriteria', () => {
    it('should GET the count endpoint with name filter', () => {
      service.countByCriteria({ name: 'Admin' }).subscribe((count) => {
        expect(count).toBe(3);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('name')).toBe('Admin');
      req.flush(3);
    });
  });

  describe('findById', () => {
    it('should GET a single profile by id', () => {
      service.findById(1).subscribe((p) => {
        expect(p).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });
  });

  describe('create', () => {
    it('should POST the profile to the base URL', () => {
      service.create(mockProfile).subscribe((p) => {
        expect(p).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockProfile);
      req.flush(mockProfile);
    });
  });

  describe('update', () => {
    it('should PUT the profile to the id-specific URL', () => {
      service.update(1, mockProfile).subscribe((p) => {
        expect(p).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockProfile);
      req.flush(mockProfile);
    });
  });

  describe('delete', () => {
    it('should DELETE the id-specific URL', () => {
      service.delete(1).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('findAllActions', () => {
    it('should GET the actions endpoint with a large page size', () => {
      const actionsPage: Page<Action> = {
        content: [mockAction],
        page: { size: 1000, number: 0, totalElements: 1, totalPages: 1 },
      };

      service.findAllActions().subscribe((page) => {
        expect(page).toEqual(actionsPage);
      });

      const req = httpMock.expectOne((r) => r.url === actionsUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('1000');
      req.flush(actionsPage);
    });
  });
});
