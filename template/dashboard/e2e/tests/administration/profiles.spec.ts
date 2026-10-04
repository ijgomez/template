import { test, expect } from '@playwright/test';

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
