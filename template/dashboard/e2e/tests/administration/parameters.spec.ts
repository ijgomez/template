import { test, expect } from '@playwright/test';

import { buildNewParameter, testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ParametersPage } from '../../pages/parameters.page';

test.describe.serial('Parameters management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list parameters', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    await expect(parametersPage.table).toBeVisible();
    await expect(parametersPage.rows.first()).toBeVisible();
    expect(await parametersPage.rows.count()).toBeGreaterThan(0);
    await expect(parametersPage.filterForm).toBeVisible();
    await expect(parametersPage.createButton).toBeVisible();
  });

  test('should filter parameters by code and type', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    const newParameter = buildNewParameter();
    await parametersPage.openCreateForm();
    await parametersPage.createParameter(newParameter);

    await parametersPage.searchByCode(newParameter.code);
    await expect(parametersPage.rows.first()).toContainText(newParameter.code);

    await parametersPage.applyTypeFilter(newParameter.type);
    await expect(parametersPage.rows.first()).toContainText(newParameter.code);

    await parametersPage.clearFilters();
    await expect(parametersPage.rows.first()).toBeVisible();
  });

  test('should create a new parameter', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    const newParameter = buildNewParameter();
    await parametersPage.openCreateForm();
    await parametersPage.createParameter(newParameter);

    await parametersPage.searchByCode(newParameter.code);
    await expect(parametersPage.rows.first()).toContainText(newParameter.code);
  });

  test('should edit an existing parameter', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    const newParameter = buildNewParameter();
    await parametersPage.openCreateForm();
    await parametersPage.createParameter(newParameter);

    const updatedValue = `${newParameter.value}-updated`;
    await parametersPage.searchByCode(newParameter.code);
    await parametersPage.openEditForm(newParameter.code);
    await parametersPage.saveEdit({ value: updatedValue, description: 'Actualizado por E2E' });

    await parametersPage.searchByCode(newParameter.code);
    await expect(parametersPage.rows.first()).toContainText(updatedValue);
  });

  test('should delete a parameter', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    const newParameter = buildNewParameter();
    await parametersPage.openCreateForm();
    await parametersPage.createParameter(newParameter);

    await parametersPage.searchByCode(newParameter.code);
    await parametersPage.deleteParameter(newParameter.code);

    await parametersPage.searchByCode(newParameter.code);
    await expect(parametersPage.rows).toHaveCount(0);
  });

  test('should export parameters to CSV', async ({ page }) => {
    const parametersPage = new ParametersPage(page);
    await parametersPage.goto();

    const download = await parametersPage.exportCsv();
    expect(download.suggestedFilename()).toMatch(/^parameters_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
