import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpDeleteButtonComponent } from './delete-button.component';

describe('TpDeleteButtonComponent', () => {
  let component: TpDeleteButtonComponent;
  let fixture: ComponentFixture<TpDeleteButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpDeleteButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpDeleteButtonComponent);
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

  it('should render an enabled danger button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().dataset['testid']).toBe('btn-delete');
    expect(button().classList.contains('btn-danger')).toBe(true);
  });

  it('should render the trash icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-trash')).not.toBeNull();
  });

  it('should disable the button when disabled is true', async () => {
    await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('should apply a custom test id', async () => {
    await setup();
    fixture.componentRef.setInput('testId', 'user-form-btn-delete');
    fixture.detectChanges();
    expect(button().dataset['testid']).toBe('user-form-btn-delete');
  });

  it('should emit delete on click', async () => {
    await setup();
    const spy = vi.fn();
    component.delete.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit delete when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.delete.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
