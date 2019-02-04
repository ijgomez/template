import { TestBed, inject } from '@angular/core/testing';

import { ClusterNodeService } from './cluster-node.service';

describe('ClusterNodeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterNodeService]
    });
  });

  it('should be created', inject([ClusterNodeService], (service: ClusterNodeService) => {
    expect(service).toBeTruthy();
  }));
});
