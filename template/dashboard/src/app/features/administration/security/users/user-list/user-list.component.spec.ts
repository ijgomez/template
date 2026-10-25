import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { UserService } from '../../../../../core/services/user.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CsvExportService } from '../../../../../core/services/csv-export.service';
import { DateService } from '../../../../../core/services/date.service';
import { UserDTO } from '../../../../../core/models/user.model';
import { Page } from '../../../../../core/models/page.model';

/**
 * Observable that always fails, used to simulate backend errors without nesting
 * extra arrow functions inside each test.
 */
function backendFailure(): Observable<never> {
  return throwError(() => new Error('boom'));
}

/**
 * Unit tests for UserListComponent focused on component logic (state, CRUD flow,
 * filters, pagination, sorting, export) with all services stubbed. The template
 * is replaced by an empty one to avoid rendering the full view and child forms.
 */
describe('UserListComponent', () => {
  let component: UserListComponent;

  const user: UserDTO = {
    id: 1,
    username: 'jdoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'jdoe@example.com',
    profileId: 2,
    profileName: 'Admin',
    reportIds: [],
    lastAccess: '2026-01-01T10:00:00Z',
    createdAt: null,
    lastModifiedAt: null,
  };

  const page: Page<UserDTO> = {
    content: [user],
    page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
  };

  // Stubs. Methods declare their parameters up-front so per-test overrides
  // (which inspect arguments) type-check correctly.
  const userService = {
    findByCriteria: (..._a: unknown[]) => of(page),
    findAllByCriteria: (..._a: unknown[]) => of([user]),
    getProfiles: () => of([{ id: 2, name: 'Admin' }]),
    create: (_u?: UserDTO) => of(user),
    update: (_id?: number, _u?: UserDTO) => of(user),
    delete: (_id?: number) => of(void 0),
  };
  const authService = { hasAction: (a: string) => a === 'USER_WRITE' };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (_notificationId: string, _messageKey: string) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const csvExportService = { export: (..._a: unknown[]) => undefined };
  const dateService = { toLocalString: (v: string) => `local:${v}` };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService },
        { provide: CsvExportService, useValue: csvExportService },
        { provide: DateService, useValue: dateService },
      ],
    })
      .overrideComponent(UserListComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load users', () => {
      component.ngOnInit();
      expect(component.users()).toEqual([user]);
      expect(component.totalElements()).toBe(1);
      expect(component.totalPages()).toBe(1);
      expect(component.isLoading()).toBe(false);
    });

    it('should stop loading on error', () => {
      userService.findByCriteria = backendFailure;
      component.ngOnInit();
      expect(component.isLoading()).toBe(false);
      userService.findByCriteria = () => of(page);
    });
  });

  describe('permissions', () => {
    it('canWrite should reflect the USER_WRITE action', () => {
      expect(component.canWrite()).toBe(true);
    });
  });

  describe('filters', () => {
    it('applyFilters should build criteria from filter fields and reset the page', () => {
      component.currentPage.set(3);
      component.filterUsername.set('jdoe');
      component.filterFirstName.set('John');
      component.filterProfileId.set(2);

      component.applyFilters();

      expect(component.criteria()).toEqual({ username: 'jdoe', firstName: 'John', profileId: 2 });
      expect(component.currentPage()).toBe(0);
    });

    it('applyFilters should omit empty fields', () => {
      component.filterUsername.set('');
      component.filterFirstName.set('');
      component.filterProfileId.set(null);

      component.applyFilters();

      expect(component.criteria()).toEqual({ username: undefined, firstName: undefined, profileId: undefined });
    });

    it('clearFilters should reset filter fields and criteria', () => {
      component.filterUsername.set('x');
      component.filterFirstName.set('y');
      component.filterProfileId.set(9);
      component.criteria.set({ username: 'x' });

      component.clearFilters();

      expect(component.filterUsername()).toBe('');
      expect(component.filterFirstName()).toBe('');
      expect(component.filterProfileId()).toBeNull();
      expect(component.criteria()).toEqual({});
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('pagination and sorting', () => {
    beforeEach(() => {
      component.totalPages.set(3);
    });

    it('goToPage should update currentPage for a valid page', () => {
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
    });

    it('goToPage should ignore out-of-range pages', () => {
      component.currentPage.set(1);
      component.goToPage(-1);
      component.goToPage(3);
      expect(component.currentPage()).toBe(1);
    });

    it('changePageSize should set size and reset page', () => {
      component.currentPage.set(2);
      component.changePageSize(50);
      expect(component.pageSize()).toBe(50);
      expect(component.currentPage()).toBe(0);
    });

    it('onSort should build the sort param', () => {
      component.onSort({ column: 'username', direction: 'asc' });
      expect(component.sortParam()).toBe('username,asc');
    });

    it('onSort should clear the sort param when direction is empty', () => {
      component.onSort({ column: 'username', direction: '' });
      expect(component.sortParam()).toBe('');
    });
  });

  describe('row selection', () => {
    it('selectRow should select and toggle-off the same row', () => {
      component.selectRow(user);
      expect(component.selectedRow()).toEqual(user);
      component.selectRow(user);
      expect(component.selectedRow()).toBeNull();
    });

    it('editSelectedUser should switch to edit mode with the selected user', () => {
      component.selectRow(user);
      component.editSelectedUser();
      expect(component.viewMode()).toBe('edit');
      expect(component.formMode()).toBe('edit');
      expect(component.formUser().id).toBe(1);
    });

    it('deleteSelectedUser should open the delete confirmation', () => {
      component.selectRow(user);
      component.deleteSelectedUser();
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.userToDelete()).toEqual(user);
    });
  });

  describe('navigation', () => {
    it('showCreateForm should reset the form to an empty user', () => {
      component.showCreateForm();
      expect(component.viewMode()).toBe('create');
      expect(component.formMode()).toBe('create');
      expect(component.formUser().id).toBeNull();
      expect(component.formUser().username).toBe('');
    });

    it('showDetail should switch to view mode', () => {
      component.showDetail(user);
      expect(component.viewMode()).toBe('detail');
      expect(component.formMode()).toBe('view');
    });

    it('backToList should switch to list mode', () => {
      component.showCreateForm();
      component.backToList();
      expect(component.viewMode()).toBe('list');
    });
  });

  describe('saveUser', () => {
    it('should call create in create mode and return to the list', () => {
      let created = false;
      userService.create = () => {
        created = true;
        return of(user);
      };
      component.formMode.set('create');

      component.saveUser(user);

      expect(created).toBe(true);
      expect(component.viewMode()).toBe('list');
      userService.create = () => of(user);
    });

    it('should call update in edit mode', () => {
      let updatedId: number | undefined;
      userService.update = (id?: number) => {
        updatedId = id;
        return of(user);
      };
      component.formMode.set('edit');

      component.saveUser(user);

      expect(updatedId).toBe(1);
      expect(component.viewMode()).toBe('list');
      userService.update = () => of(user);
    });
  });

  describe('delete flow', () => {
    it('cancelDelete should close the confirmation', () => {
      component.confirmDelete(user);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.userToDelete()).toBeNull();
    });

    it('executeDelete should delete the user and reload', () => {
      let deletedId: number | undefined;
      userService.delete = (id?: number) => {
        deletedId = id;
        return of(void 0);
      };
      component.confirmDelete(user);

      component.executeDelete();

      expect(deletedId).toBe(1);
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.userToDelete()).toBeNull();
      userService.delete = () => of(void 0);
    });

    it('executeDelete should do nothing when there is no user to delete', () => {
      let called = false;
      userService.delete = () => {
        called = true;
        return of(void 0);
      };
      component.userToDelete.set(null);

      component.executeDelete();

      expect(called).toBe(false);
      userService.delete = () => of(void 0);
    });

    it('executeDelete should surface an error notification and clear the target', () => {
      let errorMessage = '';
      userService.delete = backendFailure;
      notificationService.updateToError = (_notificationId: string, messageKey: string) => {
        errorMessage = messageKey;
      };
      component.confirmDelete(user);

      component.executeDelete();

      expect(errorMessage).toBe('notification.delete.error');
      expect(component.userToDelete()).toBeNull();
      userService.delete = () => of(void 0);
      notificationService.updateToError = () => undefined;
    });
  });

  describe('exportCsv', () => {
    it('should export the fetched rows to CSV', () => {
      let exported: { headers: string[]; rows: string[][]; name: string } | undefined;
      csvExportService.export = (...args: unknown[]) => {
        exported = { headers: args[0] as string[], rows: args[1] as string[][], name: args[2] as string };
      };

      component.exportCsv();

      expect(exported).toBeTruthy();
      expect(exported?.name).toBe('users');
      expect(exported?.rows.length).toBe(1);
      expect(exported?.rows[0][0]).toBe('jdoe');
      csvExportService.export = () => undefined;
    });

    it('should report an error notification when there is nothing to export', () => {
      userService.findAllByCriteria = () => of([]);
      let errored = false;
      notificationService.updateToError = () => {
        errored = true;
      };

      component.exportCsv();

      expect(errored).toBe(true);
      userService.findAllByCriteria = () => of([user]);
      notificationService.updateToError = () => undefined;
    });

    it('should notify an export error when the backend call fails', () => {
      let key = '';
      userService.findAllByCriteria = backendFailure;
      notificationService.updateToError = (_notificationId: string, messageKey: string) => {
        key = messageKey;
      };

      component.exportCsv();

      expect(key).toBe('notification.export.error');
      userService.findAllByCriteria = () => of([user]);
      notificationService.updateToError = () => undefined;
    });
  });

  describe('deep linking (URL sub-view state)', () => {
    it('showDetail should sync the URL with view=detail and the user id', () => {
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.showDetail(user);

      expect(component.viewMode()).toBe('detail');
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { view: 'detail', id: 1 },
      }));
    });

    it('showCreateForm should sync the URL with view=create and no id', () => {
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.showCreateForm();

      expect(component.viewMode()).toBe('create');
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { view: 'create' } }));
    });

    it('backToList should clear the sub-view query params', () => {
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.backToList();

      expect(component.viewMode()).toBe('list');
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });
});
