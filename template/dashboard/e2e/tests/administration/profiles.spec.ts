import { test, expect } from '@playwright/test';

import {
  API_URL,
  PROFILES_PATH,
  apiCreateProfile,
  apiCreateUser,
  apiDeleteProfile,
  apiDeleteUserByUsername,
  apiFindActionIds,
  apiGetProfile,
  apiLogin,
  authHeaders,
} from '../../fixtures/api-client';
import { buildNewProfile, testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ProfilesPage } from '../../pages/profiles.page';

test.describe.serial('Profiles management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list profiles', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    await expect(profilesPage.table).toBeVisible();
    await expect(profilesPage.rows.first()).toBeVisible();
    expect(await profilesPage.rows.count()).toBeGreaterThan(0);
    await expect(profilesPage.filterForm).toBeVisible();
    await expect(profilesPage.createButton).toBeVisible();
  });

  test('should filter profiles by name', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    const newProfile = buildNewProfile();
    await profilesPage.openCreateForm();
    await profilesPage.createProfile(newProfile);

    await profilesPage.searchByName(newProfile.name);
    await expect(profilesPage.rows.first()).toBeVisible();
    await expect(profilesPage.rows.first()).toContainText(newProfile.name);

    await profilesPage.clearFilters();
    await expect(profilesPage.rows.first()).toBeVisible();
  });

  test('should create a new profile', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    const newProfile = buildNewProfile();
    await profilesPage.openCreateForm();
    await profilesPage.createProfile(newProfile);

    await profilesPage.searchByName(newProfile.name);
    await expect(profilesPage.rows.first()).toContainText(newProfile.name);
  });

  test('should edit an existing profile', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    const newProfile = buildNewProfile();
    await profilesPage.openCreateForm();
    await profilesPage.createProfile(newProfile);

    const updatedName = `${newProfile.name} Updated`;
    await profilesPage.searchByName(newProfile.name);
    await profilesPage.openEditForm(newProfile.name);
    await profilesPage.saveEdit({ name: updatedName, description: 'Perfil actualizado por E2E' });

    await profilesPage.searchByName(updatedName);
    await expect(profilesPage.rows.first()).toContainText(updatedName);
  });

  test('should delete a profile', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    const newProfile = buildNewProfile();
    await profilesPage.openCreateForm();
    await profilesPage.createProfile(newProfile);

    await profilesPage.searchByName(newProfile.name);
    await profilesPage.deleteProfile(newProfile.name);

    await profilesPage.searchByName(newProfile.name);
    await expect(profilesPage.rows).toHaveCount(0);
  });

  test('should export profiles to CSV', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    const download = await profilesPage.exportCsv();
    expect(download.suggestedFilename()).toMatch(/^profiles_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

test.describe.serial('Profiles segregation of duties', () => {
  const suffix = Date.now().toString().slice(-8);
  const password = 'Test1234!';
  // Perfil con permiso de escritura pero SIN PROFILE_GRANT: puede administrar
  // perfiles, pero no debe poder concederles acciones.
  const writerUser = `e2e_prof_writer_${suffix}`;
  const writerProfileName = `e2e_prof_writer_${suffix}`;
  const profileIds: number[] = [];

  let adminToken: string;
  let writerToken: string;
  let writerProfileId: number;
  let writerProfileNameValue: string;
  let writerProfileDescription: string | null;
  let writerProfileActionIds: number[];
  let otherActionId: number;

  test.beforeAll(async ({ playwright }) => {
    // Setup: un perfil de escritura sin PROFILE_GRANT y un usuario con ese perfil,
    // creados por el administrador (que sí tiene PROFILE_GRANT).
    const request = await playwright.request.newContext();
    adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);

    writerProfileId = await apiCreateProfile(request, adminToken, writerProfileName, [
      'PROFILE_READ',
      'PROFILE_WRITE',
    ]);
    profileIds.push(writerProfileId);

    const writerProfile = await apiGetProfile(request, adminToken, writerProfileId);
    writerProfileNameValue = writerProfile.name;
    writerProfileDescription = writerProfile.description;
    writerProfileActionIds = writerProfile.actionIds;

    // Acción distinta de las que ya tiene el perfil, para forzar un cambio de acciones.
    otherActionId = (await apiFindActionIds(request, adminToken, ['USER_READ']))[0];

    await apiCreateUser(request, adminToken, { username: writerUser, password, profileId: writerProfileId });
    writerToken = await apiLogin(request, writerUser, password);
    await request.dispose();
  });

  test.afterAll(async ({ playwright }) => {
    // Teardown: eliminar el usuario y los perfiles de prueba
    const request = await playwright.request.newContext();
    await apiDeleteUserByUsername(request, adminToken, writerUser);
    for (const profileId of profileIds) {
      await apiDeleteProfile(request, adminToken, profileId);
    }
    await request.dispose();
  });

  test('TC-PRO-10 should forbid creating a profile with actions without PROFILE_GRANT', async ({ request }) => {
    // Arrange: token con PROFILE_WRITE pero sin PROFILE_GRANT (paso 1)
    // Act
    const response = await request.post(`${API_URL}${PROFILES_PATH}`, {
      headers: authHeaders(writerToken),
      data: {
        id: null,
        name: `e2e_prof_denied_${suffix}`,
        description: 'Alta denegada por segregación de funciones',
        actionIds: [otherActionId],
      },
    });

    // Assert
    expect(response.status()).toBe(403);
  });

  test('TC-PRO-10 should forbid changing the actions of a profile without PROFILE_GRANT', async ({ request }) => {
    // Arrange: se intenta reemplazar las acciones del perfil por otra distinta (paso 2)
    // Act
    const response = await request.put(`${API_URL}${PROFILES_PATH}/${writerProfileId}`, {
      headers: authHeaders(writerToken),
      data: {
        id: writerProfileId,
        name: writerProfileNameValue,
        description: writerProfileDescription,
        actionIds: [otherActionId],
      },
    });

    // Assert
    expect(response.status()).toBe(403);
  });

  test('TC-PRO-10 should allow editing a profile without changing its actions', async ({ request }) => {
    // Arrange: mismos actionIds, solo cambia la descripción (paso 3)
    // Act
    const response = await request.put(`${API_URL}${PROFILES_PATH}/${writerProfileId}`, {
      headers: authHeaders(writerToken),
      data: {
        id: writerProfileId,
        name: writerProfileNameValue,
        description: 'Descripción editada sin tocar las acciones',
        actionIds: writerProfileActionIds,
      },
    });

    // Assert
    expect(response.status()).toBe(200);
    const updated = (await response.json()) as { description: string; actionIds: number[] };
    expect(updated.description).toBe('Descripción editada sin tocar las acciones');
    expect(updated.actionIds.sort()).toEqual([...writerProfileActionIds].sort());
  });

  test('TC-PRO-10 should allow creating a profile with actions when PROFILE_GRANT is present', async ({
    request,
  }) => {
    // Arrange: el administrador sí tiene PROFILE_GRANT (paso 4)
    // Act: `apiCreateProfile` exige el 201 en el alta
    const createdProfileId = await apiCreateProfile(request, adminToken, `e2e_prof_granted_${suffix}`, [
      'USER_READ',
    ]);
    profileIds.push(createdProfileId);

    // Assert: el perfil se ha creado con la acción indicada
    const created = await apiGetProfile(request, adminToken, createdProfileId);
    expect(created.actionIds).toEqual([otherActionId]);
  });
});
