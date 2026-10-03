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
});
