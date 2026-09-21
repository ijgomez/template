import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { UserFormComponent } from './user-form.component';
import { UserDTO, ProfileRef } from '../../../../../core/models/user.model';
import { ReportService } from '../../../../../core/services/report.service';

/** Builds a UserDTO with sensible defaults. */
function buildUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 1,
    username: 'jdoe',
    password: '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'jdoe@example.com',
    profileId: 10,
    reportIds: [1, 2],
    lastAccess: null,
    createdAt: null,
    lastModifiedAt: null,
    ...overrides,
  };
}

const profiles: ProfileRef[] = [
  { id: 10, name: 'Admin' },
  { id: 20, name: 'User' },
];

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  /** Configures the fixture with the given required inputs. */
  function setup(mode: 'create' | 'edit' | 'view', user: UserDTO = buildUser(), canWrite = false) {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('user', user);
    fixture.componentRef.setInput('profiles', profiles);
    fixture.componentRef.setInput('canWrite', canWrite);
    fixture.detectChanges(); // ngOnInit -> copies user into formUser
  }

  beforeEach(async () => {
    const reportService = {
      findAll: vi.fn().mockReturnValue(of([])),
      search: vi.fn().mockReturnValue(of({ content: [], page: { size: 5, number: 0, totalElements: 0, totalPages: 1 } })),
    };

    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ReportService, useValue: reportService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup('create');
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy the input user into the internal form state', () => {
    const user = buildUser({ username: 'alice', email: 'alice@example.com' });
    setup('edit', user);
    expect(component.formUser().username).toBe('alice');
    expect(component.formUser().email).toBe('alice@example.com');
    // Must be a copy, not the same reference
    expect(component.formUser()).not.toBe(user);
  });

  describe('isReadonly', () => {
    it('should be true only in view mode', () => {
      setup('view');
      expect(component.isReadonly()).toBe(true);
    });

    it('should be false in create mode', () => {
      setup('create');
      expect(component.isReadonly()).toBe(false);
    });

    it('should be false in edit mode', () => {
      setup('edit');
      expect(component.isReadonly()).toBe(false);
    });
  });

  describe('updateField', () => {
    it('should update a field when not readonly', () => {
      setup('edit');
      component.updateField('firstName', 'Jane');
      expect(component.formUser().firstName).toBe('Jane');
    });

    it('should update the profileId field', () => {
      setup('create', buildUser({ profileId: null }));
      component.updateField('profileId', 20);
      expect(component.formUser().profileId).toBe(20);
    });

    it('should NOT update any field in view mode', () => {
      setup('view');
      const before = component.formUser().firstName;
      component.updateField('firstName', 'Changed');
      expect(component.formUser().firstName).toBe(before);
    });
  });

  describe('onSubmit', () => {
    it('should emit save with the current form value when not readonly', () => {
      setup('edit');
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.updateField('firstName', 'Updated');
      component.onSubmit();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].firstName).toBe('Updated');
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
      component.cancel.subscribe(spy);
      component.onCancel();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onEdit should emit edit with the original input user', () => {
      const user = buildUser();
      setup('view', user);
      const spy = vi.fn();
      component.edit.subscribe(spy);
      component.onEdit();
      expect(spy).toHaveBeenCalledWith(user);
    });

    it('onDelete should emit delete with the original input user', () => {
      const user = buildUser();
      setup('view', user);
      const spy = vi.fn();
      component.delete.subscribe(spy);
      component.onDelete();
      expect(spy).toHaveBeenCalledWith(user);
    });
  });
});
