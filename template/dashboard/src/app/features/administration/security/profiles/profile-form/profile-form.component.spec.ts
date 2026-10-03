import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { ProfileFormComponent } from './profile-form.component';
import { Profile } from '../models/profile.model';

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;

  const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
    id: 1,
    name: 'Administrador',
    description: 'Perfil de administración',
    actions: [],
    ...overrides,
  });

  async function setup(mode: 'create' | 'edit' | 'view' = 'create', profile: Profile = buildProfile(), actionIds: number[] = [1, 2]): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProfileFormComponent],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('actionIds', actionIds);
    fixture.detectChanges();
  }

  it('should sync profile data when input changes in edit mode', async () => {
    await setup('edit', buildProfile({ id: 10, name: 'Auditor', description: 'Auditoría' }), [9, 8]);

    fixture.componentRef.setInput('profile', buildProfile({ id: 10, name: 'Consultor', description: 'Consultoría' }));
    fixture.componentRef.setInput('actionIds', [7]);
    fixture.detectChanges();

    expect(component.formProfile().name).toBe('Consultor');
    expect(component.selectedActionIds()).toEqual([7]);
  });

  it('should disable save when the required profile name is empty', async () => {
    await setup('create', buildProfile({ name: '' }), []);

    expect(component.isSaveDisabled()).toBe(true);

    component.updateField('name', '   ');
    expect(component.isSaveDisabled()).toBe(true);

    component.updateField('name', 'Operador');
    expect(component.isSaveDisabled()).toBe(false);
  });

  it('should emit the form payload and keep the selected action ids in sync on submit', async () => {
    await setup('create', buildProfile({ name: 'Gestor', description: 'Gestión' }), [2, 4]);
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.updateField('description', 'Nueva descripción');
    component.selectedActionIds.set([8, 9]);
    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({
      profile: expect.objectContaining({ name: 'Gestor', description: 'Nueva descripción' }),
      actionIds: [8, 9],
    });
  });

  it('should emit cancel, edit and delete actions in readonly mode and ignore direct edits', async () => {
    const cancelSpy = vi.fn();
    const editSpy = vi.fn();
    const deleteSpy = vi.fn();

    await setup('view', buildProfile({ id: 12, name: 'Auditor', description: 'Auditoría', createdAt: '2026-01-01T00:00:00Z', lastModifiedAt: '2026-01-02T00:00:00Z' }), [3]);
    fixture.componentRef.setInput('canWrite', true);
    fixture.detectChanges();

    component.cancel.subscribe(cancelSpy);
    component.edit.subscribe(editSpy);
    component.delete.subscribe(deleteSpy);

    component.updateField('name', 'Cambiado');
    expect(component.formProfile().name).toBe('Auditor');

    const editButton = fixture.nativeElement.querySelector('[data-testid="profile-form-btn-edit"]');
    const deleteButton = fixture.nativeElement.querySelector('[data-testid="profile-form-btn-delete"]');
    const backButton = fixture.nativeElement.querySelector('[data-testid="profile-form-btn-back"]');

    expect(editButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
    expect(backButton).toBeTruthy();

    editButton.click();
    deleteButton.click();
    backButton.click();
    fixture.detectChanges();

    expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 12, name: 'Auditor' }));
    expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 12, name: 'Auditor' }));
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('should return the expected CSS classes for action types', async () => {
    await setup('edit', buildProfile());

    expect(component.getActionTypeBadgeClass('READ')).toBe('bg-info-subtle text-info');
    expect(component.getActionTypeBadgeClass('WRITE')).toBe('bg-warning-subtle text-warning');
    expect(component.getActionTypeBadgeClass('DELETE')).toBe('bg-danger-subtle text-danger');
    expect(component.getActionTypeBadgeClass('OTHER')).toBe('bg-secondary-subtle text-secondary');
  });
});
