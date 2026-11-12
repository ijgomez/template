import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpEditButtonComponent } from './edit-button.component';

describe('TpEditButtonComponent', () => {
  let component: TpEditButtonComponent;
  let fixture: ComponentFixture<TpEditButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpEditButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpEditButtonComponent);
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

  it('should render an enabled outline button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().dataset['testid']).toBe('btn-edit');
    expect(button().classList.contains('btn-outline-secondary')).toBe(true);
  });

  it('should render the pencil icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-pencil')).not.toBeNull();
  });

  it('should apply the primary variant', async () => {
    await setup();
    fixture.componentRef.setInput('variant', 'primary');
    fixture.detectChanges();
    expect(button().classList.contains('btn-primary')).toBe(true);
    expect(button().classList.contains('btn-outline-secondary')).toBe(false);
  });

  it('should disable the button when disabled is true', async () => {
    await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('should apply a custom test id', async () => {
    await setup();
    fixture.componentRef.setInput('testId', 'user-form-btn-edit');
    fixture.detectChanges();
    expect(button().dataset['testid']).toBe('user-form-btn-edit');
  });

  it('should emit edit on click', async () => {
    await setup();
    const spy = vi.fn();
    component.edit.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit edit when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.edit.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
