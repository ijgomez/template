import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { ProtocolSelectComponent, INTERFACE_PROTOCOLS } from './protocol-select.component';

describe('ProtocolSelectComponent', () => {
  let component: ProtocolSelectComponent;
  let fixture: ComponentFixture<ProtocolSelectComponent>;

  /** Configures the TestBed and creates the fixture. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProtocolSelectComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(ProtocolSelectComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the static protocol list', () => {
    expect(component.protocols).toEqual(INTERFACE_PROTOCOLS);
  });

  // ─── ControlValueAccessor ───────────────────────────────────

  describe('writeValue', () => {
    it('should set the selected protocol from the model value', () => {
      component.writeValue('SOAP');
      expect(component.selected()).toBe('SOAP');
    });

    it('should reset the selection to empty string when written null or undefined', () => {
      component.writeValue('REST');
      component.writeValue(null);
      expect(component.selected()).toBe('');
      component.writeValue('REST');
      component.writeValue(undefined);
      expect(component.selected()).toBe('');
    });
  });

  describe('onSelectionChange', () => {
    it('should update the selection and propagate the value', () => {
      const onChange = vi.fn();
      const onTouched = vi.fn();
      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);

      component.onSelectionChange('LDAP');

      expect(component.selected()).toBe('LDAP');
      expect(onChange).toHaveBeenCalledWith('LDAP');
      expect(onTouched).toHaveBeenCalledTimes(1);
    });

    it('should propagate empty string when the empty option is selected', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.onSelectionChange('');

      expect(component.selected()).toBe('');
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('setDisabledState', () => {
    it('should toggle the disabled signal', () => {
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled()).toBe(false);
    });
  });

  describe('validation and blur', () => {
    it('should mark as invalid when required and the touched selection is empty', () => {
      component.required = true;
      component.selected.set('');
      component.touched.set(true);
      expect(component.isInvalid()).toBe(true);
    });

    it('should not be invalid when a protocol is selected', () => {
      component.required = true;
      component.selected.set('REST');
      component.touched.set(true);
      expect(component.isInvalid()).toBe(false);
    });

    it('should trigger touched and onTouched on blur', () => {
      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);

      component.onBlur();

      expect(component.touched()).toBe(true);
      expect(onTouched).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Rendering ──────────────────────────────────────────────

  describe('select variant (filter)', () => {
    it('should render a select with a selectable empty option and all protocols', () => {
      fixture.componentRef.setInput('placeholderSelectable', true);
      fixture.componentRef.setInput('placeholderKey', 'interfaces.configuration.filters.allProtocols');
      fixture.componentRef.setInput('testId', 'filter-protocol');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const select = el.querySelector<HTMLSelectElement>('[data-testid="filter-protocol"]');
      expect(select).toBeTruthy();
      expect(select?.tagName).toBe('SELECT');
      // Empty option + one per protocol.
      expect(select?.querySelectorAll('option').length).toBe(INTERFACE_PROTOCOLS.length + 1);

      const emptyOption = select?.querySelector<HTMLOptionElement>('option[value=""]');
      expect(emptyOption?.disabled).toBe(false);
    });

    it('should reflect the written value in the select', () => {
      component.writeValue('SOAP');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const select = el.querySelector<HTMLSelectElement>('select');
      expect(select?.value).toBe('SOAP');
    });
  });

  describe('readonly variant (form view)', () => {
    it('should render a readonly disabled input with the textual value', () => {
      fixture.componentRef.setInput('variant', 'readonly');
      fixture.componentRef.setInput('testId', 'input-protocol');
      component.writeValue('REST');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector<HTMLInputElement>('[data-testid="input-protocol"]');
      expect(input).toBeTruthy();
      expect(input?.tagName).toBe('INPUT');
      expect(input?.readOnly).toBe(true);
      expect(input?.disabled).toBe(true);
      expect(input?.value).toBe('REST');
    });
  });
});
