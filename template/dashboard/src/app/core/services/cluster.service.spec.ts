import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ClusterService } from './cluster.service';
import { ClusterNode, ClusterBlock } from '../models/cluster.model';
import { Page } from '../models/page.model';
import { environment } from '../../../environments/environment';

describe('ClusterService', () => {
  let service: ClusterService;
  let httpMock: HttpTestingController;

  const nodesUrl = `${environment.apiUrl}/administration/cluster/nodes`;
  const blocksUrl = `${environment.apiUrl}/administration/cluster/blocks`;

  const mockNode: ClusterNode = {
    id: 1,
    hostname: 'node-1',
    ip: '10.0.0.1',
    status: 'ACTIVE',
    master: true,
    freeMemory: 500,
    totalMemory: 1000,
    usedMemory: 500,
    startedAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  };

  const mockBlock: ClusterBlock = {
    id: 1,
    name: 'JOB_LOCK',
    startDate: '2026-01-01T00:00:00Z',
    avgTime: 10,
    minTime: 5,
    maxTime: 20,
    total: 100,
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  };

  const mockBlockPage: Page<ClusterBlock> = {
    content: [mockBlock],
    page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClusterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('nodes', () => {
    it('findAllNodes should GET the nodes URL', () => {
      service.findAllNodes().subscribe((nodes) => {
        expect(nodes).toEqual([mockNode]);
      });

      const req = httpMock.expectOne(nodesUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockNode]);
    });

    it('findNodeById should GET a single node', () => {
      service.findNodeById(1).subscribe((node) => {
        expect(node).toEqual(mockNode);
      });

      const req = httpMock.expectOne(`${nodesUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNode);
    });

    it('setMaster should PATCH the node with the master flag', () => {
      service.setMaster(1, true).subscribe((node) => {
        expect(node).toEqual(mockNode);
      });

      const req = httpMock.expectOne(`${nodesUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ master: true });
      req.flush(mockNode);
    });
  });

  describe('blocks', () => {
    it('findBlocksByCriteria should GET with pagination only when criteria is empty', () => {
      service.findBlocksByCriteria({}, 0, 20).subscribe((page) => {
        expect(page).toEqual(mockBlockPage);
      });

      const req = httpMock.expectOne((r) => r.url === blocksUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('name')).toBeNull();
      req.flush(mockBlockPage);
    });

    it('findBlocksByCriteria should include sort and name filter when provided', () => {
      service.findBlocksByCriteria({ name: 'JOB' }, 1, 10, 'name,asc').subscribe();

      const req = httpMock.expectOne((r) => r.url === blocksUrl);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('name,asc');
      expect(req.request.params.get('name')).toBe('JOB');
      req.flush(mockBlockPage);
    });

    it('findAllBlocksByCriteria should request a large page size and return content', () => {
      service.findAllBlocksByCriteria({ name: 'JOB' }).subscribe((blocks) => {
        expect(blocks).toEqual([mockBlock]);
      });

      const req = httpMock.expectOne((r) => r.url === blocksUrl);
      expect(req.request.params.get('size')).toBe('100000');
      expect(req.request.params.get('name')).toBe('JOB');
      req.flush(mockBlockPage);
    });

    it('countBlocksByCriteria should GET the count endpoint with name filter', () => {
      service.countBlocksByCriteria({ name: 'JOB' }).subscribe((count) => {
        expect(count).toBe(5);
      });

      const req = httpMock.expectOne((r) => r.url === `${blocksUrl}/count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('name')).toBe('JOB');
      req.flush(5);
    });

    it('findBlockById should GET a single block', () => {
      service.findBlockById(1).subscribe((block) => {
        expect(block).toEqual(mockBlock);
      });

      const req = httpMock.expectOne(`${blocksUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlock);
    });
  });
});
