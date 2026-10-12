import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TpDetailButtonComponent } from './detail-button.component';

describe('TpDetailButtonComponent', () => {
  let component: TpDetailButtonComponent;
  let fixture: ComponentFixture<TpDetailButtonComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpDetailButtonComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(TpDetailButtonComponent);
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

  it('should render an enabled button with the default test id by default', async () => {
    await setup();
    expect(button().disabled).toBe(false);
    expect(button().getAttribute('data-testid')).toBe('btn-detail');
  });

  it('should render the eye icon', async () => {
    await setup();
    expect(button().querySelector('i.bi.bi-eye')).not.toBeNull();
  });

  it('should disable the button when disabled is true', async () => {
    await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });

  it('should apply a custom test id', async () => {
    await setup();
    fixture.componentRef.setInput('testId', 'users-view-detail');
    fixture.detectChanges();
    expect(button().getAttribute('data-testid')).toBe('users-view-detail');
  });

  it('should emit detail on click', async () => {
    await setup();
    const spy = vi.fn();
    component.detail.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit detail when disabled', async () => {
    await setup();
    const spy = vi.fn();
    component.detail.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    button().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
