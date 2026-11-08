import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpUserCardComponent } from './user-card.component';

describe('TpUserCardComponent', () => {
  let fixture: ComponentFixture<TpUserCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TpUserCardComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
    fixture = TestBed.createComponent(TpUserCardComponent);
  });

  const query = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(query('stat-users')).not.toBeNull();
  });

  it('should show the total when loaded', () => {
    fixture.componentRef.setInput('total', 148);
    fixture.detectChanges();
    expect(query('stat-users-value')?.textContent).toContain('148');
    expect(query('stat-users-error')).toBeNull();
  });

  it('should show a spinner while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(query('stat-users-value')).toBeNull();
  });

  it('should show the error state', () => {
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(query('stat-users-error')).not.toBeNull();
    expect(query('stat-users-value')).toBeNull();
  });
});
