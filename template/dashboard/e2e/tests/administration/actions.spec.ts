import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ActionsPage } from '../../pages/actions.page';

test.describe.serial('Actions management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list actions', async ({ page }) => {
    const actionsPage = new ActionsPage(page);
    await actionsPage.goto();

    await expect(actionsPage.table).toBeVisible();
    await expect(actionsPage.rows.first()).toBeVisible();
    expect(await actionsPage.rows.count()).toBeGreaterThan(0);
    await expect(actionsPage.filterForm).toBeVisible();
    await expect(actionsPage.editButton).toBeVisible();
  });

  test('should filter actions by code and type', async ({ page }) => {
    const actionsPage = new ActionsPage(page);
    await actionsPage.goto();

    const firstCode = (await actionsPage.rows.first().textContent()) ?? 'READ';
    await actionsPage.applyCodeFilter(firstCode.trim().split(' ')[0]);
    await expect(actionsPage.rows.first()).toBeVisible();

    await actionsPage.clearFilters();
    await actionsPage.applyTypeFilter('READ');
    await expect(actionsPage.rows.first()).toBeVisible();
    await expect(actionsPage.rows.first()).toContainText('READ');
  });

  test('should open detail and edit an action', async ({ page }) => {
    const actionsPage = new ActionsPage(page);
    await actionsPage.goto();

    await actionsPage.openEditFormByIndex(0);
    const originalName = await actionsPage.inputName.inputValue();
    const updatedName = `${originalName} Updated`;

    await actionsPage.saveEdit({
      name: updatedName,
      description: 'Actualizado por E2E',
      type: 'WRITE',
    });

    await expect(actionsPage.table).toBeVisible();
    await expect(actionsPage.rows.first()).toContainText(updatedName);
  });

  test('should export actions to CSV', async ({ page }) => {
    const actionsPage = new ActionsPage(page);
    await actionsPage.goto();

    const download = await actionsPage.exportCsv();
    expect(download.suggestedFilename()).toMatch(/^actions_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
