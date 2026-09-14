import { TestBed } from '@angular/core/testing';

import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise from navigator.onLine', () => {
    expect(service.isOnline()).toBe(navigator.onLine);
  });

  it('should set isOnline to false when an offline event fires', () => {
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);
  });

  it('should set isOnline to true when an online event fires', () => {
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);
  });

  it('should stop reacting to events after destroy', () => {
    service.ngOnDestroy();

    window.dispatchEvent(new Event('offline'));
    // Listeners removed on destroy, so the signal keeps its last value.
    expect(service.isOnline()).toBe(navigator.onLine);
  });
});
