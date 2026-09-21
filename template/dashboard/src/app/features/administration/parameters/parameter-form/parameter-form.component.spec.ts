import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

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
