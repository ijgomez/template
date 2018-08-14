import { TestBed, inject } from '@angular/core/testing';

import { TracesService } from './traces.service';

describe('TracesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TracesService]
    });
  });

  it('should be created', inject([TracesService], (service: TracesService) => {
    expect(service).toBeTruthy();
  }));
});
