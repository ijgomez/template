import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';

import { OfflineBannerComponent } from './offline-banner.component';
import { ConnectivityService } from '../../services/connectivity.service';

/** Stub exposing a writable online signal to drive the banner. */
class ConnectivityServiceStub {
  readonly isOnline = signal(true);
}

describe('OfflineBannerComponent', () => {
  let component: OfflineBannerComponent;
  let fixture: ComponentFixture<OfflineBannerComponent>;
  let connectivity: ConnectivityServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ConnectivityService, useClass: ConnectivityServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineBannerComponent);
    component = fixture.componentInstance;
    connectivity = TestBed.inject(ConnectivityService) as unknown as ConnectivityServiceStub;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the banner while online', () => {
    const banner = fixture.nativeElement.querySelector('[data-testid="offline-banner"]');
    expect(banner).toBeNull();
  });

  it('should render the banner when offline', () => {
    connectivity.isOnline.set(false);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[data-testid="offline-banner"]');
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.getAttribute('aria-live')).toBe('assertive');
  });

  it('should hide the banner again when connectivity is restored', () => {
    connectivity.isOnline.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="offline-banner"]')).toBeTruthy();

    connectivity.isOnline.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="offline-banner"]')).toBeNull();
  });
});
