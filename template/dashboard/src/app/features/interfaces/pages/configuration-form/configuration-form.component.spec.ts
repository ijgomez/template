import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { ConfigurationFormComponent, FormMode } from './configuration-form.component';
import { InterfaceConfig } from '../../../../core/models/interface.model';

/** Builds an InterfaceConfig with sensible defaults. */
function buildConfig(overrides: Partial<InterfaceConfig> = {}): InterfaceConfig {
  return {
    id: 1,
    name: 'Payment Gateway',
    description: 'Payment integration',
    url: 'https://api.example.com/pay',
    protocol: 'REST',
    checkFrequency: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T10:00:00Z',
    lastModifiedAt: '2026-01-02T10:00:00Z',
    ...overrides,
  };
}

describe('ConfigurationFormComponent', () => {
  let component: ConfigurationFormComponent;
  let fixture: ComponentFixture<ConfigurationFormComponent>;

  /** Configures the fixture with the given required inputs. */
  function setup(mode: FormMode, config: InterfaceConfig | null = buildConfig()) {
    fixture = TestBed.createComponent(ConfigurationFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges(); // effect -> copies config into formConfig
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationFormComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
  });

  it('should create in view mode', () => {
    setup('view');
    expect(component).toBeTruthy();
  });

  describe('isReadonly', () => {
    it('should be true in view mode', () => {
      setup('view');
      expect(component.isReadonly()).toBe(true);
    });

    it('should be false in create mode', () => {
      setup('create');
      expect(component.isReadonly()).toBe(false);
    });
  });

  it('should copy the input config into the internal form state', () => {
    const config = buildConfig({ name: 'alice-api' });
    setup('view', config);
    expect(component.formConfig()?.name).toBe('alice-api');
    // Must be a copy, not the same reference
    expect(component.formConfig()).not.toBe(config);
  });

  describe('view rendering', () => {
    const fieldIds = [
      'input-name',
      'input-status',
      'input-description',
      'input-url',
      'input-protocol',
      'input-check-frequency',
    ];

    const hiddenAuditIds = ['input-created-at', 'input-last-modified-at'];

    it('should render all fields as readonly and disabled', () => {
      setup('view');
      for (const id of fieldIds) {
        const input = fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.readOnly).toBe(true);
        expect(input.disabled).toBe(true);
      }
    });

    it('should not render audit fields (createdAt / lastModifiedAt)', () => {
      setup('view');
      for (const id of hiddenAuditIds) {
        const input = fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
        expect(input).toBeNull();
      }
    });

    it('should render field values', async () => {
      setup('view');
      // The protocol field is rendered by tp-protocol-select bound via ngModel,
      // which propagates its value to the CVA asynchronously.
      await fixture.whenStable();
      fixture.detectChanges();
      const name = fixture.nativeElement.querySelector('[data-testid="input-name"]') as HTMLInputElement;
      const url = fixture.nativeElement.querySelector('[data-testid="input-url"]') as HTMLInputElement;
      const protocol = fixture.nativeElement.querySelector('[data-testid="input-protocol"]') as HTMLInputElement;
      expect(name.value).toBe('Payment Gateway');
      expect(url.value).toBe('https://api.example.com/pay');
      expect(protocol.value).toBe('REST');
    });
  });

  describe('output events', () => {
    it('onBack should emit both back and cancel', () => {
      setup('view');
      const backSpy = vi.fn();
      const cancelSpy = vi.fn();
      component.back.subscribe(backSpy);
      component.cancel.subscribe(cancelSpy);

      component.onBack();

      expect(backSpy).toHaveBeenCalledTimes(1);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit back when the back button is clicked', () => {
      setup('view');
      const backSpy = vi.fn();
      component.back.subscribe(backSpy);

      const button = fixture.nativeElement.querySelector('[data-testid="configuration-form-btn-back"]') as HTMLButtonElement;
      button.click();

      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
