import { TestBed } from '@angular/core/testing';

import { TracesService } from './traces.service';

describe('TracesService', () => {
  let service: TracesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TracesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
