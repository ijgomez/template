import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserService } from './user.service';
import { UserDTO, UserCriteria, ProfileRef, ReportRef } from '../models/user.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/security/users`;
  const profilesUrl = `${environment.apiUrl}/administration/security/profiles`;
  const reportsUrl = `${environment.apiUrl}/reports`;

  const mockUser: UserDTO = {
    id: 1,
    username: 'jdoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'jdoe@example.com',
    profileId: 2,
    profileName: 'Administrator',
    reportIds: [10, 11],
    lastAccess: '2026-01-01T10:00:00Z',
    createdAt: '2025-12-01T10:00:00Z',
    lastModifiedAt: '2026-01-01T10:00:00Z',
  };

  const mockPage: Page<UserDTO> = {
    content: [mockUser],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findByCriteria', () => {
    it('should GET the base URL with pagination params only when criteria is empty', () => {
      service.findByCriteria({}, 0, 20).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('sort')).toBeNull();
      expect(req.request.params.get('username')).toBeNull();
      req.flush(mockPage);
    });

    it('should include sort and all filter params when provided', () => {
      const criteria: UserCriteria = {
        username: 'jdoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'jdoe@example.com',
        profileId: 2,
      };

      service.findByCriteria(criteria, 1, 10, 'username,asc').subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('username,asc');
      expect(req.request.params.get('username')).toBe('jdoe');
      expect(req.request.params.get('firstName')).toBe('John');
      expect(req.request.params.get('lastName')).toBe('Doe');
      expect(req.request.params.get('email')).toBe('jdoe@example.com');
      expect(req.request.params.get('profileId')).toBe('2');
      req.flush(mockPage);
    });
  });

  describe('findAllByCriteria', () => {
    it('should request a large page size and return only the content array', () => {
      service.findAllByCriteria({ username: 'jdoe' }, 'username,asc').subscribe((users) => {
        expect(users).toEqual([mockUser]);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('sort')).toBe('username,asc');
      expect(req.request.params.get('username')).toBe('jdoe');
      req.flush(mockPage);
    });
  });

  describe('countByCriteria', () => {
    it('should GET the count endpoint with filter params and return the number', () => {
      service.countByCriteria({ email: 'jdoe@example.com', profileId: 3 }).subscribe((count) => {
        expect(count).toBe(42);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('email')).toBe('jdoe@example.com');
      expect(req.request.params.get('profileId')).toBe('3');
      req.flush(42);
    });
  });

  describe('findById', () => {
    it('should GET a single user by id', () => {
      service.findById(1).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('create', () => {
    it('should POST the user to the base URL', () => {
      service.create(mockUser).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockUser);
      req.flush(mockUser);
    });
  });

  describe('update', () => {
    it('should PUT the user to the id-specific URL', () => {
      service.update(1, mockUser).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUser);
      req.flush(mockUser);
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

  describe('getProfiles', () => {
    it('should GET the profile references', () => {
      const profiles: ProfileRef[] = [{ id: 1, name: 'Admin' }];

      service.getProfiles().subscribe((res) => {
        expect(res).toEqual(profiles);
      });

      const req = httpMock.expectOne(`${profilesUrl}/references`);
      expect(req.request.method).toBe('GET');
      req.flush(profiles);
    });
  });

  describe('getReports', () => {
    it('should GET all reports', () => {
      const reports: ReportRef[] = [{ id: 10, name: 'Report A' }];

      service.getReports().subscribe((res) => {
        expect(res).toEqual(reports);
      });

      const req = httpMock.expectOne(`${reportsUrl}/all`);
      expect(req.request.method).toBe('GET');
      req.flush(reports);
    });
  });
});
