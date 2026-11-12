import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpExportButtonComponent } from './export-button.component';

describe('TpExportButtonComponent', () => {
  let component: TpExportButtonComponent;
  let fixture: ComponentFixture<TpExportButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpExportButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpExportButtonComponent);
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
    expect(button().dataset['testid']).toBe('btn-export');
    expect(button().classList.contains('btn-outline-secondary')).toBe(true);
  });

  it('should render the icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-download')).not.toBeNull();
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

  it('should emit export on click', async () => {
    await setup();
    const spy = vi.fn();
    component.export.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit export when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.export.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
