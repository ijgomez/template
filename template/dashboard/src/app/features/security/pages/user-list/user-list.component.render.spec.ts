import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { DateService } from '../../../../core/services/date.service';
import { UserDTO } from '../../../../core/models/user.model';

/**
 * Template rendering tests for UserListComponent. The real template and child
 * components are rendered (filters, toolbar, table, form, delete modal) while
 * all services are stubbed.
 */
describe('UserListComponent (template)', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;
  let canWrite = true;

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
    locked: false,
  };
  const lockedUser: UserDTO = { ...user, id: 2, username: 'locked', locked: true };

  const userService = {
    findByCriteria: (..._a: unknown[]): Observable<unknown> =>
      of({ content: [user, lockedUser], page: { size: 10, number: 0, totalElements: 2, totalPages: 1 } }),
    findAllByCriteria: (..._a: unknown[]): Observable<unknown> => of([user]),
    getProfiles: () => of([{ id: 2, name: 'Admin' }]),
    create: (..._a: unknown[]): Observable<unknown> => of(user),
    update: (..._a: unknown[]): Observable<unknown> => of(user),
    delete: (..._a: unknown[]): Observable<unknown> => of(void 0),
  };
  const authService = { hasAction: (a: string) => canWrite && a === 'USER_WRITE' };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const csvExportService = { export: (..._a: unknown[]) => undefined };
  const dateService = { toLocalString: (v: string) => `local:${v}`, toLocal: (v: string) => `local:${v}` };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    canWrite = true;
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
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list view', () => {
    it('should render the filters, toolbar and table', async () => {
      await render();

      expect(byTestId('users-filter-form')).toBeTruthy();
      expect(byTestId('filter-username')).toBeTruthy();
      expect(byTestId('filter-firstName')).toBeTruthy();
      expect(byTestId('filter-locked')).toBeTruthy();
      expect(byTestId('btn-filter-search')).toBeTruthy();
      expect(byTestId('btn-filter-clear')).toBeTruthy();
      expect(byTestId('btn-export')).toBeTruthy();
      expect(byTestId('users-table')).toBeTruthy();
    });

    it('should render the users with profile and lock badges', async () => {
      await render();

      const text = el().textContent ?? '';
      expect(text).toContain('jdoe');
      expect(text).toContain('Admin');
      expect(el().querySelectorAll('[data-testid="user-locked-badge"]')).toHaveLength(2);
    });

    it('should show write actions only with USER_WRITE', async () => {
      await render();
      expect(byTestId('btn-create')).toBeTruthy();
      expect(byTestId('btn-edit')).toBeTruthy();
      expect(byTestId('btn-delete')).toBeTruthy();
    });

    it('should hide write actions without USER_WRITE', async () => {
      canWrite = false;
      await render();

      expect(byTestId('btn-create')).toBeNull();
      expect(byTestId('btn-edit')).toBeNull();
      expect(byTestId('btn-delete')).toBeNull();
    });

    it('should disable edit and delete until a row is selected', async () => {
      await render();
      expect((byTestId('btn-edit') as HTMLButtonElement).disabled).toBe(true);
      expect((byTestId('btn-delete') as HTMLButtonElement).disabled).toBe(true);

      component.selectRow(user);
      await render();

      expect((byTestId('btn-edit') as HTMLButtonElement).disabled).toBe(false);
      expect((byTestId('btn-delete') as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('filters', () => {
    it('should update the username and first name signals on input', async () => {
      await render();
      const username = byTestId('filter-username') as HTMLInputElement;
      const firstName = byTestId('filter-firstName') as HTMLInputElement;

      username.value = 'jd';
      username.dispatchEvent(new Event('input'));
      firstName.value = 'Jo';
      firstName.dispatchEvent(new Event('input'));

      expect(component.filterUsername()).toBe('jd');
      expect(component.filterFirstName()).toBe('Jo');
    });

    it('should update the lock-state signal when the select changes', async () => {
      await render();
      const select = byTestId('filter-locked') as HTMLSelectElement;

      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));

      expect(component.filterLocked()).toBe(true);
    });

    it('should apply the filters on submit', async () => {
      await render();
      component.filterUsername.set('jdoe');

      (byTestId('users-filter-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

      expect(component.criteria().username).toBe('jdoe');
    });

    it('should clear the filters from the clear button', async () => {
      await render();
      component.filterUsername.set('jdoe');

      byTestId('btn-filter-clear')!.click();

      expect(component.filterUsername()).toBe('');
    });
  });

  describe('toolbar actions', () => {
    it('should open the create form', async () => {
      await render();

      byTestId('btn-create')!.click();
      await render();

      expect(component.viewMode()).toBe('create');
      expect(el().querySelector('app-user-form')).toBeTruthy();
    });

    it('should open the edit form for the selected user', async () => {
      await render();
      component.selectRow(user);
      await render();

      byTestId('btn-edit')!.click();
      await render();

      expect(component.viewMode()).toBe('edit');
      expect(el().querySelector('app-user-form')).toBeTruthy();
    });

    it('should open the detail for the selected user', async () => {
      await render();
      component.selectRow(user);
      await render();

      const detail = byTestId('btn-detail') as HTMLElement;
      (detail.querySelector('button') ?? detail).click();
      await render();

      expect(component.viewMode()).toBe('detail');
      expect(el().querySelector('app-user-form')).toBeTruthy();
    });

    it('should export the users', async () => {
      await render();
      const spy = vi.spyOn(userService, 'findAllByCriteria');

      byTestId('btn-export')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete confirmation modal', () => {
    it('should show the modal with the username and cancel it', async () => {
      await render();
      component.selectRow(user);
      await render();

      byTestId('btn-delete')!.click();
      await render();

      expect(component.userToDelete()).toEqual(user);
      expect(byTestId('delete-confirm-body')?.textContent).toContain('users.delete.confirmMessage');

      byTestId('btn-cancel-delete')!.click();
      await render();

      expect(byTestId('delete-confirm-body')).toBeNull();
    });

    it('should delete the user when confirmed', async () => {
      await render();
      const spy = vi.spyOn(userService, 'delete');
      component.confirmDelete(user);
      await render();

      byTestId('btn-confirm-delete')!.click();
      await render();

      expect(spy).toHaveBeenCalledWith(1);
      expect(byTestId('delete-confirm-body')).toBeNull();
    });
  });
});
