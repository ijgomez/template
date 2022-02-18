import { TestBed } from '@angular/core/testing';

import { CrytoService } from './cryto.service';

describe('CrytoService', () => {
  let service: CrytoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrytoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
