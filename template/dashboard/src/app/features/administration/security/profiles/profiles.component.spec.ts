import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ProfilesComponent } from './profiles.component';
import { ProfileService } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { DateService } from '../../../../core/services/date.service';
import { Profile } from './models/profile.model';
import { Page } from '../../../../core/models/page.model';

function profile(id: number, overrides: Partial<Profile> = {}): Profile {
  return {
    id,
    name: `Profile ${id}`,
    description: `Desc ${id}`,
    actions: [],
    ...overrides,
  };
}

function pageOf(profiles: Profile[], totalElements = profiles.length): Page<Profile> {
  return {
    content: profiles,
    page: { size: 10, number: 0, totalElements, totalPages: Math.ceil(totalElements / 10) || 1 },
  };
}

describe('ProfilesComponent', () => {
  let component: ProfilesComponent;
  let fixture: ComponentFixture<ProfilesComponent>;
  let profileService: {
    findByCriteria: ReturnType<typeof vi.fn>;
    findAllByCriteria: ReturnType<typeof vi.fn>;
    findAllActions: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let notification: {
    showError: ReturnType<typeof vi.fn>;
    showSuccess: ReturnType<typeof vi.fn>;
    showProgress: ReturnType<typeof vi.fn>;
    updateToSuccess: ReturnType<typeof vi.fn>;
    updateToError: ReturnType<typeof vi.fn>;
  };
  let csvExport: { export: ReturnType<typeof vi.fn> };
  let authHasAction: ReturnType<typeof vi.fn>;

  const listPage = pageOf([profile(1), profile(2), profile(3)], 25);

  beforeEach(async () => {
    profileService = {
      findByCriteria: vi.fn().mockReturnValue(of(listPage)),
      findAllByCriteria: vi.fn().mockReturnValue(of(listPage.content)),
      findAllActions: vi.fn().mockReturnValue(of(pageOf([]))),
      create: vi.fn().mockReturnValue(of(profile(9))),
      update: vi.fn().mockReturnValue(of(profile(1))),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    notification = {
      showError: vi.fn().mockReturnValue('err-id'),
      showSuccess: vi.fn().mockReturnValue('ok-id'),
      showProgress: vi.fn().mockReturnValue('progress-id'),
      updateToSuccess: vi.fn(),
      updateToError: vi.fn(),
    };
    csvExport = { export: vi.fn() };
    authHasAction = vi.fn().mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [ProfilesComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ProfileService, useValue: profileService },
        { provide: AuthService, useValue: { hasAction: authHasAction } },
        { provide: NotificationService, useValue: notification },
        { provide: CsvExportService, useValue: csvExport },
        { provide: DateService, useValue: { toLocalString: (s: string) => `local(${s})` } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadProfiles
  });

  it('should create and load profiles on init', () => {
    expect(component).toBeTruthy();
    expect(profileService.findByCriteria).toHaveBeenCalled();
    expect(component.profiles().length).toBe(3);
    expect(component.totalElements()).toBe(25);
    expect(component.totalPages()).toBe(3);
    expect(component.isLoading()).toBe(false);
  });

  it('should notify error and stop loading when list fails', () => {
    profileService.findByCriteria.mockReturnValue(throwError(() => new Error('boom')));
    component.loadProfiles();
    expect(component.isLoading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('notification.error');
  });

  it('canWrite should reflect the PROFILE_WRITE action', () => {
    expect(component.canWrite()).toBe(true);
    expect(authHasAction).toHaveBeenCalledWith('PROFILE_WRITE');
  });

  // ─── Filters ────────────────────────────────────────────────

  describe('filters', () => {
    it('applyFilter should reset the page and reload with the name criteria', () => {
      component.currentPage.set(2);
      component.filterName.set('admin');
      profileService.findByCriteria.mockClear();
      component.applyFilter();
      expect(component.currentPage()).toBe(0);
      expect(profileService.findByCriteria).toHaveBeenCalledWith(
        { name: 'admin' }, 0, 10, ''
      );
    });

    it('clearFilter should reset name and page then reload', () => {
      component.filterName.set('admin');
      component.currentPage.set(3);
      profileService.findByCriteria.mockClear();
      component.clearFilter();
      expect(component.filterName()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(profileService.findByCriteria).toHaveBeenCalledWith({}, 0, 10, '');
    });
  });

  // ─── Sorting ────────────────────────────────────────────────

  describe('onSort', () => {
    it('should set sortParam and reload for a server-sortable column', () => {
      profileService.findByCriteria.mockClear();
      component.onSort({ column: 'name', direction: 'asc' });
      expect(component.sortParam()).toBe('name,asc');
      expect(component.currentPage()).toBe(0);
      expect(profileService.findByCriteria).toHaveBeenCalledWith({}, 0, 10, 'name,asc');
    });

    it('should clear sortParam when direction is null', () => {
      component.sortParam.set('name,asc');
      component.onSort({ column: 'name', direction: '' });
      expect(component.sortParam()).toBe('');
    });

    it('should sort the "actions" column client-side by action count', () => {
      component.profiles.set([
        profile(1, { actions: [{ id: 1, code: 'A', type: 'READ', name: 'A' }] }),
        profile(2, { actions: [] }),
        profile(3, { actions: [
          { id: 1, code: 'A', type: 'READ', name: 'A' },
          { id: 2, code: 'B', type: 'WRITE', name: 'B' },
        ] }),
      ]);
      profileService.findByCriteria.mockClear();
      component.onSort({ column: 'actions', direction: 'asc' });
      expect(component.profiles().map(p => p.id)).toEqual([2, 1, 3]);
      // Client-side sort must not hit the backend
      expect(profileService.findByCriteria).not.toHaveBeenCalled();

      component.onSort({ column: 'actions', direction: 'desc' });
      expect(component.profiles().map(p => p.id)).toEqual([3, 1, 2]);
    });

    it('should reload from the server when actions sort direction is null', () => {
      profileService.findByCriteria.mockClear();
      component.onSort({ column: 'actions', direction: '' });
      expect(profileService.findByCriteria).toHaveBeenCalled();
    });
  });

  // ─── Pagination ─────────────────────────────────────────────

  describe('pagination', () => {
    it('goToPage should navigate and reload for an in-range page', () => {
      profileService.findByCriteria.mockClear();
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
      expect(profileService.findByCriteria).toHaveBeenCalled();
    });

    it('goToPage should ignore out-of-range pages', () => {
      profileService.findByCriteria.mockClear();
      component.goToPage(-1);
      component.goToPage(99);
      expect(component.currentPage()).toBe(0);
      expect(profileService.findByCriteria).not.toHaveBeenCalled();
    });

    it('changePageSize should update the size, reset page and reload', () => {
      profileService.findByCriteria.mockClear();
      component.changePageSize(25);
      expect(component.pageSize()).toBe(25);
      expect(component.currentPage()).toBe(0);
      expect(profileService.findByCriteria).toHaveBeenCalledWith({}, 0, 25, '');
    });
  });

  // ─── Row selection ──────────────────────────────────────────

  describe('row selection', () => {
    it('selectRow should select and toggle-off the same row', () => {
      const p = profile(1);
      component.selectRow(p);
      expect(component.selectedRow()?.id).toBe(1);
      component.selectRow(p);
      expect(component.selectedRow()).toBeNull();
    });

    it('editSelectedProfile should open the edit form when a row is selected', () => {
      component.selectRow(profile(1));
      component.editSelectedProfile();
      expect(component.viewMode()).toBe('edit');
      expect(component.formMode()).toBe('edit');
    });

    it('editSelectedProfile should do nothing without a selection', () => {
      component.selectedRow.set(null);
      component.editSelectedProfile();
      expect(component.viewMode()).toBe('list');
    });

    it('deleteSelectedProfile should open the confirm dialog when a row is selected', () => {
      component.selectRow(profile(1));
      component.deleteSelectedProfile();
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.profileToDelete()?.id).toBe(1);
    });
  });

  // ─── Navigation ─────────────────────────────────────────────

  describe('navigation', () => {
    it('showDetail should populate form state in view mode', () => {
      component.showDetail(profile(1, { actionIds: [5, 6] }));
      expect(component.viewMode()).toBe('detail');
      expect(component.formMode()).toBe('view');
      expect(component.formActionIds()).toEqual([5, 6]);
    });

    it('showDetail should derive action IDs from actions when actionIds is absent', () => {
      component.showDetail(profile(1, { actions: [
        { id: 7, code: 'A', type: 'READ', name: 'A' },
        { id: 8, code: 'B', type: 'READ', name: 'B' },
      ] }));
      expect(component.formActionIds()).toEqual([7, 8]);
    });

    it('showCreateForm should reset the form to a blank profile', () => {
      component.showCreateForm();
      expect(component.viewMode()).toBe('create');
      expect(component.formMode()).toBe('create');
      expect(component.formProfile().id).toBeNull();
      expect(component.formActionIds()).toEqual([]);
    });

    it('backToList should return to the list and reload', () => {
      component.showCreateForm();
      profileService.findByCriteria.mockClear();
      component.backToList();
      expect(component.viewMode()).toBe('list');
      expect(profileService.findByCriteria).toHaveBeenCalled();
    });
  });

  // ─── CRUD ───────────────────────────────────────────────────

  describe('saveProfile', () => {
    it('should create a new profile and go back to the list on success', () => {
      component.showCreateForm();
      profileService.findByCriteria.mockClear();
      component.saveProfile({ profile: profile(null as any, { id: null }), actionIds: [1, 2] });
      expect(profileService.create).toHaveBeenCalled();
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.create.success');
      expect(component.viewMode()).toBe('list');
    });

    it('should update an existing profile on success', () => {
      component.showEditForm(profile(1));
      component.saveProfile({ profile: profile(1), actionIds: [3] });
      expect(profileService.update).toHaveBeenCalledWith(1, expect.objectContaining({ id: 1, actionIds: [3] }));
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.update.success');
    });

    it('should report an error and stay on the form when create fails', () => {
      profileService.create.mockReturnValue(throwError(() => new Error('boom')));
      component.showCreateForm();
      component.saveProfile({ profile: profile(null as any, { id: null }), actionIds: [] });
      expect(notification.updateToError).toHaveBeenCalledWith('progress-id', 'notification.create.error');
      expect(component.viewMode()).toBe('create');
    });
  });

  // ─── Delete ─────────────────────────────────────────────────

  describe('delete flow', () => {
    it('confirmDelete should open the confirm dialog', () => {
      component.confirmDelete(profile(2));
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.profileToDelete()?.id).toBe(2);
    });

    it('cancelDelete should close the dialog and clear the target', () => {
      component.confirmDelete(profile(2));
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.profileToDelete()).toBeNull();
    });

    it('executeDelete should delete the profile and reload on success', () => {
      component.confirmDelete(profile(2));
      profileService.findByCriteria.mockClear();
      component.executeDelete();
      expect(profileService.delete).toHaveBeenCalledWith(2);
      expect(notification.updateToSuccess).toHaveBeenCalledWith('progress-id', 'notification.delete.success');
      expect(component.profileToDelete()).toBeNull();
      expect(profileService.findByCriteria).toHaveBeenCalled();
    });

    it('executeDelete should report an error when deletion fails', () => {
      profileService.delete.mockReturnValue(throwError(() => new Error('boom')));
      component.confirmDelete(profile(2));
      component.executeDelete();
      expect(notification.updateToError).toHaveBeenCalledWith('progress-id', 'notification.delete.error');
      expect(component.profileToDelete()).toBeNull();
    });

    it('executeDelete should do nothing when there is no target with an id', () => {
      component.profileToDelete.set(null);
      component.executeDelete();
      expect(profileService.delete).not.toHaveBeenCalled();
    });
  });

  // ─── CSV export ─────────────────────────────────────────────

  describe('exportCsv', () => {
    it('should export the filtered rows and notify success', () => {
      profileService.findAllByCriteria.mockReturnValue(of([
        profile(1, { actions: [{ id: 1, code: 'READ_A', type: 'READ', name: 'A' }], createdAt: '2026-01-01T00:00:00Z' }),
      ]));
      component.exportCsv();
      expect(csvExport.export).toHaveBeenCalled();
      expect(notification.showSuccess).toHaveBeenCalledWith('notification.export.success');
    });

    it('should notify when there is nothing to export', () => {
      profileService.findAllByCriteria.mockReturnValue(of([]));
      component.exportCsv();
      expect(csvExport.export).not.toHaveBeenCalled();
      expect(notification.showError).toHaveBeenCalledWith('notification.export.empty');
    });

    it('should notify an error when the export fetch fails', () => {
      profileService.findAllByCriteria.mockReturnValue(throwError(() => new Error('boom')));
      component.exportCsv();
      expect(notification.showError).toHaveBeenCalledWith('notification.export.error');
    });

    it('should include the active name filter in the export criteria', () => {
      component.filterName.set('admin');
      component.exportCsv();
      expect(profileService.findAllByCriteria).toHaveBeenCalledWith({ name: 'admin' }, '');
    });
  });
});
