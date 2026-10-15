import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TpInterfaceSelectComponent } from './interface-select.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { InterfaceConfig } from '../../../../core/models/interface.model';

const interfaces: InterfaceConfig[] = [
  {
    id: 10,
    name: 'Billing API',
    description: 'Billing integration',
    url: 'https://example.com/billing',
    protocol: 'REST',
    checkFrequency: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 20,
    name: 'FTP',
    description: 'File transfer',
    url: 'ftp://example.com',
    protocol: 'SMTP',
    checkFrequency: 120,
    status: 'INACTIVE',
    createdAt: '2026-01-03T00:00:00Z',
    lastModifiedAt: '2026-01-04T00:00:00Z',
  },
];

describe('TpInterfaceSelectComponent', () => {
  let component: TpInterfaceSelectComponent;
  let fixture: ComponentFixture<TpInterfaceSelectComponent>;
  let interfaceService: {
    findAllConfigurations: ReturnType<typeof vi.fn>;
  };

  /** Configures the TestBed and creates the fixture. detectChanges triggers ngOnInit. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpInterfaceSelectComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: InterfaceService, useValue: interfaceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TpInterfaceSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadInterfaces
  }

  beforeEach(() => {
    interfaceService = {
      findAllConfigurations: vi.fn().mockReturnValue(of(interfaces)),
    };
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ─── Interface loading ──────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load interfaces from the service', async () => {
      await setup();
      expect(interfaceService.findAllConfigurations).toHaveBeenCalledTimes(1);
      expect(component.interfaces()).toEqual(interfaces);
    });

    it('should leave interfaces empty when the service fails', async () => {
      interfaceService.findAllConfigurations.mockReturnValue(throwError(() => new Error('boom')));
      await setup();
      expect(component.interfaces()).toEqual([]);
    });
  });

  // ─── ControlValueAccessor ───────────────────────────────────

  describe('writeValue', () => {
    it('should set the selected interface name from the model value', async () => {
      await setup();
      component.writeValue('FTP');
      expect(component.selected()).toBe('FTP');
    });

    it('should reflect the written value in the select', async () => {
      await setup();
      component.writeValue('FTP');
      fixture.detectChanges();

      expect(component.selected()).toBe('FTP');
      expect(fixture.nativeElement.querySelector('select').value).toBe('FTP');
    });

    it('should reset the selection to empty string when written null or undefined', async () => {
      await setup();
      component.writeValue('FTP');
      component.writeValue(null);
      expect(component.selected()).toBe('');
      component.writeValue('FTP');
      component.writeValue(undefined);
      expect(component.selected()).toBe('');
    });
  });

  describe('onSelectionChange', () => {
    it('should update the selection and propagate the value', async () => {
      await setup();
      const onChange = vi.fn();
      const onTouched = vi.fn();
      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);

      component.onSelectionChange('Billing API');

      expect(component.selected()).toBe('Billing API');
      expect(onChange).toHaveBeenCalledWith('Billing API');
      expect(onTouched).toHaveBeenCalledTimes(1);
    });

    it('should propagate empty string when the empty option is selected', async () => {
      await setup();
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.onSelectionChange('');

      expect(component.selected()).toBe('');
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('setDisabledState', () => {
    it('should toggle the disabled signal', async () => {
      await setup();
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled()).toBe(false);
    });
  });

  describe('validation and blur', () => {
    it('should mark as invalid when required and the touched selection is empty', async () => {
      await setup();
      component.required = true;
      component.selected.set('');
      component.touched.set(true);
      expect(component.isInvalid()).toBe(true);
    });

    it('should not be invalid when an interface is selected', async () => {
      await setup();
      component.required = true;
      component.selected.set('FTP');
      component.touched.set(true);
      expect(component.isInvalid()).toBe(false);
    });

    it('should trigger touched and onTouched on blur', async () => {
      await setup();
      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);

      component.onBlur();

      expect(component.touched()).toBe(true);
      expect(onTouched).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Rendering ──────────────────────────────────────────────

  describe('select variant (filter)', () => {
    it('should render a select with a selectable empty option and one option per interface', async () => {
      await setup();
      fixture.componentRef.setInput('placeholderSelectable', true);
      fixture.componentRef.setInput('placeholderKey', 'interfaces.interfaceList.filters.allInterfaces');
      fixture.componentRef.setInput('testId', 'interface-list-filter-interface');
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector(
        '[data-testid="interface-list-filter-interface"]',
      ) as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.tagName).toBe('SELECT');
      // Empty option + one per interface.
      expect(select.querySelectorAll('option').length).toBe(interfaces.length + 1);

      const emptyOption = select.querySelector('option[value=""]') as HTMLOptionElement;
      expect(emptyOption.disabled).toBe(false);
    });
  });
});
