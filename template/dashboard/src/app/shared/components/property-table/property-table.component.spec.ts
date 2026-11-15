import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { PropertyTableComponent } from './property-table.component';

const PROPS = { 'user.language': 'es', 'java.version': '21.0.1', 'os.name': 'Linux' };

@Component({
  standalone: true,
  imports: [PropertyTableComponent],
  template: `
    <tp-property-table [properties]="first" heading="h.first" filterLabel="l.first" testId="pt-a" />
    <tp-property-table [properties]="second" heading="h.second" filterLabel="l.second" testId="pt-b" />
  `,
})
class TwoTablesHostComponent {
  first: Record<string, string> = { alpha: 'one', beta: 'two', gamma: 'three' };
  second: Record<string, string> = { alpha: 'one', beta: 'two', gamma: 'three' };
}

describe('PropertyTableComponent', () => {
  let fixture: ComponentFixture<PropertyTableComponent>;

  function setup(properties: Record<string, string> | null | undefined, testId = 'pt') {
    fixture = TestBed.createComponent(PropertyTableComponent);
    fixture.componentRef.setInput('properties', properties);
    fixture.componentRef.setInput('heading', 'test.heading');
    fixture.componentRef.setInput('filterLabel', 'test.filterLabel');
    fixture.componentRef.setInput('testId', testId);
    fixture.detectChanges();
  }

  const root = () => fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement = HTMLElement>(id: string) =>
    root().querySelector<T>(`[data-testid="${id}"]`);
  const rowKeys = (id: string) =>
    Array.from(root().querySelectorAll(`[data-testid="${id}"]`)).map((r) => r.querySelector('td')?.textContent?.trim());

  function type(id: string, text: string) {
    const input = q<HTMLInputElement>(id)!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTableComponent, TwoTablesHostComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
  });

  it('renders the rows sorted by key', () => {
    setup(PROPS);
    expect(rowKeys('pt-row')).toEqual(['java.version', 'os.name', 'user.language']);
  });

  it('filters by key, case-insensitively', () => {
    setup(PROPS);
    type('pt-filter', 'JAVA');
    expect(rowKeys('pt-row')).toEqual(['java.version']);
  });

  it('filters by value', () => {
    setup(PROPS);
    type('pt-filter', 'linux');
    expect(rowKeys('pt-row')).toEqual(['os.name']);
  });

  it('restores all rows when the filter is cleared', () => {
    setup(PROPS);
    type('pt-filter', 'java');
    type('pt-filter', '');
    expect(rowKeys('pt-row')).toHaveLength(3);
  });

  it('shows the no-matches message keeping the filter text and without table', () => {
    setup(PROPS);
    type('pt-filter', 'zzz-none');
    expect(q('pt-no-matches')?.textContent).toContain('cluster.nodes.form.noMatches');
    expect(q('pt-table')).toBeNull();
    expect(q<HTMLInputElement>('pt-filter')?.value).toBe('zzz-none');
  });

  it.each([
    ['null', null],
    ['empty', {}],
  ])('shows the no-properties message without filter or table when properties are %s', (_name, value) => {
    setup(value);
    expect(q('pt-empty')?.textContent).toContain('cluster.nodes.form.noProperties');
    expect(q('pt-filter')).toBeNull();
    expect(q('pt-table')).toBeNull();
    expect(root().querySelector('label')).toBeNull();
  });

  it('associates the filter label with the input via for/id', () => {
    setup(PROPS);
    const label = root().querySelector('label')!;
    expect(label.getAttribute('for')).toBe('pt-filter');
    expect(label.textContent).toContain('test.filterLabel');
    expect(root().querySelector('#pt-filter')).toBe(q('pt-filter'));
  });

  it('uses th scope="col" in the table header', () => {
    setup(PROPS);
    const headers = Array.from(q('pt-table')!.querySelectorAll('th'));
    expect(headers).toHaveLength(2);
    headers.forEach((th) => expect(th.getAttribute('scope')).toBe('col'));
  });

  it('derives data-testid and heading id from testId and labels the section', () => {
    setup(PROPS, 'custom');
    expect(q('custom-section')).not.toBeNull();
    expect(q('custom-table')).not.toBeNull();
    expect(q('custom-filter')).not.toBeNull();
    expect(rowKeys('custom-row')).toHaveLength(3);
    const heading = root().querySelector('#custom-heading');
    expect(heading?.textContent).toContain('test.heading');
    expect(q('custom-section')?.getAttribute('aria-labelledby')).toBe('custom-heading');
  });

  it('keeps an independent filter state per instance', () => {
    const host = TestBed.createComponent(TwoTablesHostComponent);
    host.detectChanges();
    const el = host.nativeElement as HTMLElement;
    const keys = (id: string) =>
      Array.from(el.querySelectorAll(`[data-testid="${id}"]`)).map((r) => r.querySelector('td')?.textContent?.trim());

    const input = el.querySelector<HTMLInputElement>('[data-testid="pt-a-filter"]')!;
    input.value = 'alp';
    input.dispatchEvent(new Event('input'));
    host.detectChanges();

    expect(keys('pt-a-row')).toEqual(['alpha']);
    expect(keys('pt-b-row')).toEqual(['alpha', 'beta', 'gamma']);
    expect(el.querySelector<HTMLInputElement>('[data-testid="pt-b-filter"]')?.value).toBe('');
  });
});
