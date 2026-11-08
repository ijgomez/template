import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { PwaUpdateComponent } from './pwa-update.component';
import { PwaUpdateService } from '../../services/pwa-update.service';

/**
 * Template rendering tests for PwaUpdateComponent: the update banner is only
 * shown when an update is available and its buttons call the service.
 */
describe('PwaUpdateComponent (template)', () => {
  let fixture: ComponentFixture<PwaUpdateComponent>;
  let hasUpdate$: BehaviorSubject<boolean>;
  let service: { hasUpdate$: BehaviorSubject<boolean>; activateUpdate: ReturnType<typeof vi.fn>; dismissUpdate: ReturnType<typeof vi.fn> };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  beforeEach(async () => {
    hasUpdate$ = new BehaviorSubject<boolean>(false);
    service = { hasUpdate$, activateUpdate: vi.fn(), dismissUpdate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PwaUpdateComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: PwaUpdateService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateComponent);
    fixture.detectChanges();
  });

  it('should not render the banner when there is no update', () => {
    expect(byTestId('pwa-update-banner')).toBeNull();
  });

  it('should render an accessible banner when an update is available', async () => {
    hasUpdate$.next(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = byTestId('pwa-update-banner')!;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.getAttribute('aria-live')).toBe('polite');
    expect(byTestId('btn-pwa-update')).toBeTruthy();
    expect(byTestId('btn-pwa-dismiss')).toBeTruthy();
  });

  it('should activate the update when the update button is clicked', async () => {
    hasUpdate$.next(true);
    fixture.detectChanges();

    byTestId('btn-pwa-update')!.click();

    expect(service.activateUpdate).toHaveBeenCalledTimes(1);
  });

  it('should dismiss the update when the close button is clicked', async () => {
    hasUpdate$.next(true);
    fixture.detectChanges();

    byTestId('btn-pwa-dismiss')!.click();

    expect(service.dismissUpdate).toHaveBeenCalledTimes(1);
  });

  it('should hide the banner once the update is no longer available', async () => {
    hasUpdate$.next(true);
    fixture.detectChanges();
    expect(byTestId('pwa-update-banner')).toBeTruthy();

    hasUpdate$.next(false);
    fixture.detectChanges();

    expect(byTestId('pwa-update-banner')).toBeNull();
  });
});
