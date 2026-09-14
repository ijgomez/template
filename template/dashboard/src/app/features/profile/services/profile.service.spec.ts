import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProfileService } from './profile.service';
import { UpdateProfileRequest, UserProfile } from '../models/profile.model';
import { environment } from '../../../../environments/environment';

describe('ProfileService (feature)', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/administration/security/users/me`;

  const mockProfile: UserProfile = {
    username: 'jdoe',
    nombre: 'John',
    apellidos: 'Doe',
    email: 'jdoe@example.com',
    lastAccess: '2026-01-01T10:00:00Z',
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

  describe('getProfile', () => {
    it('should GET the /users/me endpoint', () => {
      service.getProfile().subscribe((profile) => {
        expect(profile).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should PUT the editable fields to the /users/me endpoint', () => {
      const payload: UpdateProfileRequest = {
        nombre: 'Jane',
        apellidos: 'Roe',
        email: 'jane@example.com',
      };

      service.updateProfile(payload).subscribe((profile) => {
        expect(profile).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockProfile);
    });
  });
});
