import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpExecuteButtonComponent } from './execute-button.component';

describe('TpExecuteButtonComponent', () => {
  let component: TpExecuteButtonComponent;
  let fixture: ComponentFixture<TpExecuteButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpExecuteButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpExecuteButtonComponent);
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

  it('should render an enabled btn-primary button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().dataset['testid']).toBe('btn-execute');
    expect(button().classList.contains('btn-primary')).toBe(true);
  });

  it('should render the icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-play-fill')).not.toBeNull();
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

  it('should emit execute on click', async () => {
    await setup();
    const spy = vi.fn();
    component.execute.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit execute when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.execute.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should be a submit button by default and honour type=button', async () => {
    await setup();
    expect(button().getAttribute('type')).toBe('submit');
    fixture.componentRef.setInput('type', 'button');
    fixture.detectChanges();
    expect(button().getAttribute('type')).toBe('button');
  });
});
