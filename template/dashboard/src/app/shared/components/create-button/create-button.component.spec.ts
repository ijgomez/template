import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpCreateButtonComponent } from './create-button.component';

describe('TpCreateButtonComponent', () => {
  let component: TpCreateButtonComponent;
  let fixture: ComponentFixture<TpCreateButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpCreateButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpCreateButtonComponent);
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

  it('should render an enabled primary button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().dataset['testid']).toBe('btn-create');
    expect(button().classList.contains('btn-primary')).toBe(true);
  });

  it('should render the plus icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-plus-lg')).not.toBeNull();
  });

  it('should disable the button when disabled is true', async () => {
    await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('should apply a custom test id', async () => {
    await setup();
    fixture.componentRef.setInput('testId', 'users-btn-create');
    fixture.detectChanges();
    expect(button().dataset['testid']).toBe('users-btn-create');
  });

  it('should emit create on click', async () => {
    await setup();
    const spy = vi.fn();
    component.create.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit create when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.create.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
