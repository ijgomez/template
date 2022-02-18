import { TestBed, inject } from '@angular/core/testing';

import { ValidationsHelper } from './validation.helper';

describe('ValidationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidationsHelper]
    });
  });

  it('should be created', inject([ValidationsHelper], (service: ValidationsHelper) => {
    expect(service).toBeTruthy();
  }));
});
