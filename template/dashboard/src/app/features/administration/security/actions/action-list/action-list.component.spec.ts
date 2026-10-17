import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ActionListComponent } from './action-list.component';
import { ActionService } from '../../../../../core/services/action.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CsvExportService } from '../../../../../core/services/csv-export.service';
import { Action } from '../models/action.model';
import { Page } from '../../../../../core/models/page.model';

function action(id: number, overrides: Partial<Action> = {}): Action {
  return {
    id,
    code: `ACTION_${id}`,
    name: `Action ${id}`,
    type: 'READ',
    description: `Desc ${id}`,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function pageOf(items: Action[], totalElements = items.length): Page<Action> {
  return {
    content: items,
    page: { size: 10, number: 0, totalElements, totalPages: Math.ceil(totalElements / 10) || 1 },
  };
}

describe('ActionListComponent', () => {
  let component: ActionListComponent;
  let fixture: ComponentFixture<ActionListComponent>;
  let actionService: {
    findByCriteria: ReturnType<typeof vi.fn>;
    findAllByCriteria: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const listPage = pageOf([action(1), action(2)], 2);

  beforeEach(async () => {
    actionService = {
      findByCriteria: vi.fn().mockReturnValue(of(listPage)),
      findAllByCriteria: vi.fn().mockReturnValue(of(listPage.content)),
      findById: vi.fn().mockReturnValue(of(action(1))),
      update: vi.fn().mockReturnValue(of(action(1))),
    };
    const notification = {
      showProgress: vi.fn().mockReturnValue('p'),
      updateToSuccess: vi.fn(),
      updateToError: vi.fn(),
      dismiss: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ActionListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ActionService, useValue: actionService },
        { provide: AuthService, useValue: { hasAction: () => true } },
        { provide: NotificationService, useValue: notification },
        { provide: CsvExportService, useValue: { export: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadActions + queryParams subscription
  });

  it('should create and load actions on init', () => {
    expect(component).toBeTruthy();
    expect(actionService.findByCriteria).toHaveBeenCalled();
    expect(component.actions().length).toBe(2);
    expect(component.viewMode()).toBe('list');
  });

  describe('navigation', () => {
    it('showDetail should switch to detail mode with the action', () => {
      component.showDetail(action(1));
      expect(component.viewMode()).toBe('detail');
      expect(component.selectedAction()?.id).toBe(1);
    });

    it('showEditForm should switch to edit mode with the action', () => {
      component.showEditForm(action(2));
      expect(component.viewMode()).toBe('edit');
      expect(component.selectedAction()?.id).toBe(2);
    });

    it('backToList should clear selection and return to list', () => {
      component.showDetail(action(1));
      component.backToList();
      expect(component.viewMode()).toBe('list');
      expect(component.selectedAction()).toBeNull();
    });
  });

  describe('deep linking (URL sub-view state)', () => {
    it('showDetail should sync the URL with view=detail and the action id', () => {
      const spy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.showDetail(action(1));
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { view: 'detail', id: 1 } }));
    });

    it('showEditForm should sync the URL with view=edit and the action id', () => {
      const spy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.showEditForm(action(2));
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { view: 'edit', id: 2 } }));
    });

    it('backToList should clear the sub-view query params', () => {
      const spy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.backToList();
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });
});
