import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ParameterService } from '../../../../core/services/parameter.service';
import { ParameterFormComponent } from './parameter-form.component';
import { Parameter, ParameterType } from '../../../../core/models/parameter.model';

function buildParameter(overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: 1,
    code: 'MY_CODE',
    description: 'A parameter',
    value: 'hello',
    type: 'STRING',
    createdAt: null,
    lastModifiedAt: null,
    ...overrides,
  };
}

describe('ParameterFormComponent', () => {
  let component: ParameterFormComponent;
  let fixture: ComponentFixture<ParameterFormComponent>;

  function setup(mode: 'create' | 'edit' | 'view', parameter: Parameter = buildParameter(), canWrite = false) {
    fixture = TestBed.createComponent(ParameterFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('parameter', parameter);
    fixture.componentRef.setInput('canWrite', canWrite);
    fixture.detectChanges(); // ngOnInit -> copies parameter into formData
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParameterFormComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
  });

  it('should create', () => {
    setup('create');
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy the input parameter into the internal form state', () => {
    const parameter = buildParameter({ code: 'ABC', value: '42', type: 'INTEGER' });
    setup('edit', parameter);
    expect(component.formData().code).toBe('ABC');
    expect(component.formData().value).toBe('42');
    expect(component.formData()).not.toBe(parameter);
  });

  it('should sync updated input parameter values after the component is initialized', () => {
    const first = buildParameter({ code: 'FIRST', value: '1', type: 'INTEGER' });
    const second = buildParameter({ code: 'SECOND', value: '2', type: 'INTEGER' });

    setup('edit', first);
    fixture.componentRef.setInput('parameter', second);
    fixture.detectChanges();

    expect(component.formData().code).toBe('SECOND');
    expect(component.formData().value).toBe('2');
  });

  it('should disable save when required code is empty or the typed value is invalid', () => {
    setup('create', buildParameter({ code: '', value: 'abc', type: 'INTEGER' }));
    expect(component.isSaveDisabled()).toBe(true);

    component.updateField('code', 'TOKEN');
    expect(component.isSaveDisabled()).toBe(true);

    component.updateField('value', '123');
    expect(component.isSaveDisabled()).toBe(false);
  });

  it('should block save when the code already exists in the database', () => {
    const parameterService = TestBed.inject(ParameterService);
    vi.spyOn(parameterService, 'countByCriteria').mockReturnValue(of(1));

    setup('create', buildParameter({ code: '' }));
    component.updateField('code', 'EXISTING');

    expect(component.codeExistsError()).toBe('Code already exists in the database');
    expect(component.isSaveDisabled()).toBe(true);
  });

  describe('isReadonly', () => {
    it('should be true only in view mode', () => {
      setup('view');
      expect(component.isReadonly()).toBe(true);
    });

    it('should be false in create and edit modes', () => {
      setup('create');
      expect(component.isReadonly()).toBe(false);
      setup('edit');
      expect(component.isReadonly()).toBe(false);
    });
  });

  describe('updateField', () => {
    it('should update a field when not readonly', () => {
      setup('edit');
      component.updateField('description', 'New description');
      expect(component.formData().description).toBe('New description');
    });

    it('should NOT update any field in view mode', () => {
      setup('view');
      const before = component.formData().description;
      component.updateField('description', 'Changed');
      expect(component.formData().description).toBe(before);
    });

    it('should validate when the type changes', () => {
      setup('edit', buildParameter({ type: 'STRING', value: 'not-a-number' }));
      component.updateField('type', 'INTEGER');
      expect(component.typeValueError()).not.toBe('');
    });

    it('should validate when the value changes', () => {
      setup('edit', buildParameter({ type: 'INTEGER', value: '' }));
      component.updateField('value', 'abc');
      expect(component.typeValueError()).not.toBe('');
    });
  });

  describe('type/value validation via onSubmit', () => {
    function submitWith(type: ParameterType, value: string): { emitted: boolean; error: string } {
      setup('edit', buildParameter({ type, value }));
      let emitted = false;
      component.save.subscribe(() => (emitted = true));
      component.onSubmit();
      return { emitted, error: component.typeValueError() };
    }

    it('should accept a valid INTEGER and emit save', () => {
      const { emitted, error } = submitWith('INTEGER', '-123');
      expect(error).toBe('');
      expect(emitted).toBe(true);
    });

    it('should reject a non-numeric INTEGER and block save', () => {
      const { emitted, error } = submitWith('INTEGER', '12.5');
      expect(error).not.toBe('');
      expect(emitted).toBe(false);
    });

    it('should accept valid BOOLEAN values', () => {
      expect(submitWith('BOOLEAN', 'true').emitted).toBe(true);
      expect(submitWith('BOOLEAN', 'false').emitted).toBe(true);
    });

    it('should reject an invalid BOOLEAN value', () => {
      const { emitted, error } = submitWith('BOOLEAN', 'yes');
      expect(error).not.toBe('');
      expect(emitted).toBe(false);
    });

    it('should accept a valid ISO-8601 DATE', () => {
      const { emitted, error } = submitWith('DATE', '2026-09-21');
      expect(error).toBe('');
      expect(emitted).toBe(true);
    });

    it('should reject an invalid DATE', () => {
      const { emitted, error } = submitWith('DATE', '21/09/2026');
      expect(error).not.toBe('');
      expect(emitted).toBe(false);
    });

    it('should accept any STRING value', () => {
      expect(submitWith('STRING', 'anything goes').emitted).toBe(true);
    });

    it('should treat an empty value as valid regardless of type', () => {
      expect(submitWith('INTEGER', '').emitted).toBe(true);
    });
  });

  describe('onSubmit guards', () => {
    it('should NOT emit save in view mode', () => {
      setup('view');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit the current form value on a valid submit', () => {
      setup('edit');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.updateField('value', 'updated');
      component.onSubmit();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].value).toBe('updated');
    });
  });

  describe('inline validation errors (accessibility)', () => {
    /**
     * Marks the named control as touched + dirty through Angular's forms API
     * (robust against one-way [ngModel] + signal rebinding) and refreshes the view.
     * ngModel controls register asynchronously, so we await stabilization first.
     */
    async function touchControl(name: string) {
      await fixture.whenStable();
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
      const control = form.controls[name];
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
      fixture.detectChanges();
    }

    it('should show an inline required error for an empty code, linked via aria-describedby', async () => {
      setup('create', buildParameter({ code: '' }));
      await touchControl('paramCode');

      const input = fixture.nativeElement.querySelector('[data-testid="input-code"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-code"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.id).toBe('paramCode-error');
      expect(input.getAttribute('aria-describedby')).toBe('paramCode-error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should show the codeExists error linked via aria-describedby', async () => {
      const parameterService = TestBed.inject(ParameterService);
      vi.spyOn(parameterService, 'countByCriteria').mockReturnValue(of(1));

      setup('create', buildParameter({ code: '' }));
      component.updateField('code', 'EXISTING');
      await touchControl('paramCode');

      const input = fixture.nativeElement.querySelector('[data-testid="input-code"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-code"]') as HTMLElement;
      expect(error).toBeTruthy();
      // Non-empty code is valid for the required rule, so the message is the uniqueness one.
      expect(error.textContent?.trim()).toBe('Code already exists in the database');
      expect(input.getAttribute('aria-describedby')).toBe('paramCode-error');
    });

    it('should show an inline type/value error for a malformed INTEGER value', async () => {
      setup('create', buildParameter({ type: 'INTEGER', value: 'abc', code: 'C1' }));
      await touchControl('paramValue');

      const input = fixture.nativeElement.querySelector('[data-testid="input-value"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-value"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(input.getAttribute('aria-describedby')).toBe('paramValue-error');
    });

    it('should NOT render an error nor aria-describedby when the code is valid', () => {
      setup('edit', buildParameter({ code: 'VALID_CODE' }));
      const input = fixture.nativeElement.querySelector('[data-testid="input-code"]') as HTMLInputElement;

      expect(fixture.nativeElement.querySelector('[data-testid="error-code"]')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('error summary (accessibility)', () => {
    it('should not render the summary before a submit is attempted', () => {
      setup('create', buildParameter({ code: '', value: '' }));
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });

    it('should list required errors and move focus to the summary after a failed submit', async () => {
      setup('create', buildParameter({ code: '', value: '' }));

      component.onSubmit();
      await fixture.whenStable();
      fixture.detectChanges();

      const summary = fixture.nativeElement.querySelector('[data-testid="error-summary"]') as HTMLElement;
      expect(summary).toBeTruthy();
      expect(summary.getAttribute('role')).toBe('alert');
      expect(summary.getAttribute('tabindex')).toBe('-1');

      const hrefs = Array.from(summary.querySelectorAll('a.alert-link')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('#paramCode');
      expect(hrefs).toContain('#paramValue');

      expect(summary).toBe(document.activeElement);
    });

    it('should include the type/value business error in the summary', () => {
      setup('create', buildParameter({ code: 'C1', type: 'INTEGER', value: 'abc' }));
      const entries = component.formErrors();
      const valueError = entries.find((e) => e.fieldId === 'paramValue');
      expect(valueError?.message).toBeTruthy();
    });

    it('should NOT render the summary when the submit is valid', () => {
      setup('create', buildParameter({ code: 'C1', type: 'STRING', value: 'ok' }));
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.onSubmit();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });
  });

  describe('output events', () => {
    it('onCancel should emit cancel', () => {
      setup('edit');
      const spy = vi.fn();
      component.cancel.subscribe(spy);
      component.onCancel();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onEdit should emit edit with the original parameter', () => {
      const parameter = buildParameter();
      setup('view', parameter);
      const spy = vi.fn();
      component.edit.subscribe(spy);
      component.onEdit();
      expect(spy).toHaveBeenCalledWith(parameter);
    });

    it('onDelete should emit delete with the original parameter', () => {
      const parameter = buildParameter();
      setup('view', parameter);
      const spy = vi.fn();
      component.delete.subscribe(spy);
      component.onDelete();
      expect(spy).toHaveBeenCalledWith(parameter);
    });
  });
});
