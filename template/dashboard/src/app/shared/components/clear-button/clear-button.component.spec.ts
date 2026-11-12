import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpClearButtonComponent } from './clear-button.component';

describe('TpClearButtonComponent', () => {
  let component: TpClearButtonComponent;
  let fixture: ComponentFixture<TpClearButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpClearButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpClearButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render an enabled btn-outline-secondary button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().dataset['testid']).toBe('btn-filter-clear');
    expect(button().classList.contains('btn-outline-secondary')).toBe(true);
  });

  it('should render the icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-x-circle')).not.toBeNull();
  });

  it('should disable the button when disabled is true', async () => {
    await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('should apply a custom test id', async () => {
    await setup();
    fixture.componentRef.setInput('testId', 'custom-id');
    fixture.detectChanges();
    expect(button().dataset['testid']).toBe('custom-id');
  });

  it('should emit clear on click', async () => {
    await setup();
    const spy = vi.fn();
    component.clear.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit clear when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.clear.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
