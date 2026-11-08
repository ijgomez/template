import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { TpNodeCardComponent } from './node-card.component';

describe('TpNodeCardComponent', () => {
  let fixture: ComponentFixture<TpNodeCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TpNodeCardComponent],
      providers: [provideRouter([]), provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
    fixture = TestBed.createComponent(TpNodeCardComponent);
  });

  const query = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(query('stat-cluster-nodes')).not.toBeNull();
  });

  it('should show a spinner while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(query('stat-cluster-nodes-value')).toBeNull();
  });

  it('should show the error state without status classes', () => {
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(query('stat-cluster-nodes-value')).toBeNull();
    expect(query('stat-cluster-nodes')?.classList.contains('tp-stat-card-warning')).toBe(false);
  });

  it('should show success state when every node is active', () => {
    fixture.componentRef.setInput('activeNodes', 2);
    fixture.componentRef.setInput('totalNodes', 2);
    fixture.detectChanges();
    expect(query('stat-cluster-nodes-ok')).not.toBeNull();
    expect(query('stat-cluster-nodes')?.classList.contains('tp-stat-card-success')).toBe(true);
  });

  it('should show a link to nodes when some are inactive', () => {
    fixture.componentRef.setInput('activeNodes', 1);
    fixture.componentRef.setInput('totalNodes', 3);
    fixture.detectChanges();
    expect(query('stat-cluster-nodes-link')?.getAttribute('href')).toBe('/administration/cluster/nodes');
    expect(query('stat-cluster-nodes')?.classList.contains('tp-stat-card-warning')).toBe(true);
  });
});
