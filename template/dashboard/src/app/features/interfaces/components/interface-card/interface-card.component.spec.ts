import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { TpInterfaceCardComponent } from './interface-card.component';

describe('TpInterfaceCardComponent', () => {
  let fixture: ComponentFixture<TpInterfaceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TpInterfaceCardComponent],
      providers: [provideRouter([]), provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
    fixture = TestBed.createComponent(TpInterfaceCardComponent);
  });

  const query = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(query('stat-interfaces')).not.toBeNull();
  });

  it('should show a spinner while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(query('stat-interfaces-value')).toBeNull();
  });

  it('should show the error state without status classes', () => {
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(query('stat-interfaces-value')).toBeNull();
    expect(query('stat-interfaces')?.classList.contains('tp-stat-card-success')).toBe(false);
    expect(query('stat-interfaces')?.classList.contains('tp-stat-card-warning')).toBe(false);
  });

  it('should show success state when no interface is in error', () => {
    fixture.componentRef.setInput('total', 4);
    fixture.detectChanges();
    expect(query('stat-interfaces-value')?.textContent).toContain('4');
    expect(query('stat-interfaces-ok')).not.toBeNull();
    expect(query('stat-interfaces')?.classList.contains('tp-stat-card-success')).toBe(true);
  });

  it('should show a link to the configuration when some interfaces are in error', () => {
    fixture.componentRef.setInput('total', 3);
    fixture.componentRef.setInput('withError', 1);
    fixture.detectChanges();
    expect(query('stat-interfaces-error-link')?.getAttribute('href')).toBe('/interfaces/configuration');
    expect(query('stat-interfaces')?.classList.contains('tp-stat-card-warning')).toBe(true);
  });
});
