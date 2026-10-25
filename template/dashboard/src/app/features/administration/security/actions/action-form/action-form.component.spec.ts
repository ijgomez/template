import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';

import { ActionFormComponent } from './action-form.component';
import { Action } from '../models/action.model';

/** Builds an Action with sensible defaults. */
function buildAction(overrides: Partial<Action> = {}): Action {
  return {
    id: 1,
    code: 'USER_READ',
    name: 'Read users',
    description: 'Allows reading users',
    type: 'READ',
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('ActionFormComponent', () => {
  let component: ActionFormComponent;
  let fixture: ComponentFixture<ActionFormComponent>;

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

  /** Configures the fixture with the given required inputs. */
  function setup(mode: 'edit' | 'view' = 'edit', action: Action = buildAction(), canEdit = false) {
    fixture = TestBed.createComponent(ActionFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('action', action);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.detectChanges(); // ngOnInit -> copies action into local signals
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionFormComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
  });

  it('should create', () => {
    setup('edit');
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy the input action into the internal signals', () => {
    setup('edit', buildAction({ name: 'Write users', description: 'desc', type: 'WRITE' }));
    expect(component.editName()).toBe('Write users');
    expect(component.editDescription()).toBe('desc');
    expect(component.editType()).toBe('WRITE');
  });

  it('should default an empty description to an empty string', () => {
    setup('edit', buildAction({ description: null }));
    expect(component.editDescription()).toBe('');
  });

  describe('isReadonly', () => {
    it('should be true only in view mode', () => {
      setup('view');
      expect(component.isReadonly()).toBe(true);
    });

    it('should be false in edit mode', () => {
      setup('edit');
      expect(component.isReadonly()).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should emit save with the current edited values, preserving id and code', () => {
      const action = buildAction({ id: 5, code: 'USER_WRITE' });
      setup('edit', action);
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.editName.set('Updated name');
      component.editDescription.set('Updated description');
      component.editType.set('WRITE');
      component.onSubmit();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toEqual({
        id: 5,
        code: 'USER_WRITE',
        name: 'Updated name',
        description: 'Updated description',
        type: 'WRITE',
      });
    });

    it('should emit a null description when the edited value is empty', () => {
      setup('edit');
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.editDescription.set('');
      component.onSubmit();

      expect(spy.mock.calls[0][0].description).toBeNull();
    });

    it('should NOT emit save in view mode', () => {
      setup('view');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('output events', () => {
    it('onCancel should emit cancel', () => {
      setup('edit');
      const spy = vi.fn();
      component.cancelled.subscribe(spy);
      component.onCancel();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onEdit should emit edit with the original action', () => {
      const action = buildAction();
      setup('view', action);
      const spy = vi.fn();
      component.edit.subscribe(spy);
      component.onEdit();
      expect(spy).toHaveBeenCalledWith(action);
    });
  });

  describe('inline validation errors (accessibility)', () => {
    it('should show an inline required error for an empty name, linked via aria-describedby', async () => {
      setup('edit', buildAction({ name: '' }));
      await touchControl('actionName');

      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]') as HTMLInputElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-name"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.id).toBe('actionName-error');
      expect(input.getAttribute('aria-describedby')).toBe('actionName-error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should show an inline required error for an empty type, linked via aria-describedby', async () => {
      setup('edit', buildAction({ type: '' }));
      await touchControl('actionType');

      const select = fixture.nativeElement.querySelector('[data-testid="select-type"]') as HTMLSelectElement;
      const error = fixture.nativeElement.querySelector('[data-testid="error-type"]') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.id).toBe('actionType-error');
      expect(select.getAttribute('aria-describedby')).toBe('actionType-error');
    });

    it('should NOT render an error nor aria-describedby when the name is valid', () => {
      setup('edit', buildAction({ name: 'Valid name' }));
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]') as HTMLInputElement;

      expect(fixture.nativeElement.querySelector('[data-testid="error-name"]')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('error summary (accessibility)', () => {
    it('should not render the summary before a submit is attempted', () => {
      setup('edit', buildAction({ name: '', type: '' }));
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });

    it('should list required errors and move focus to the summary after a failed submit', async () => {
      setup('edit', buildAction({ name: '', type: '' }));

      component.onSubmit();
      await fixture.whenStable();
      fixture.detectChanges();

      const summary = fixture.nativeElement.querySelector('[data-testid="error-summary"]') as HTMLElement;
      expect(summary).toBeTruthy();
      expect(summary.getAttribute('role')).toBe('alert');
      expect(summary.getAttribute('tabindex')).toBe('-1');

      const hrefs = Array.from(summary.querySelectorAll('a.alert-link')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('#actionName');
      expect(hrefs).toContain('#actionType');

      expect(summary).toBe(document.activeElement);
    });

    it('should NOT emit save when the form is invalid on submit', () => {
      setup('edit', buildAction({ name: '' }));
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.onSubmit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.submitAttempted()).toBe(true);
    });

    it('should NOT render the summary when the submit is valid', () => {
      setup('edit', buildAction({ name: 'Valid', type: 'READ' }));
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.onSubmit();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.querySelector('[data-testid="error-summary"]')).toBeNull();
    });
  });
});
