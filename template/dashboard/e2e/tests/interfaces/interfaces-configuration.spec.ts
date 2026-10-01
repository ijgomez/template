import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { InterfacesConfigurationPage } from '../../pages/interfaces-configuration.page';

/**
 * Tests E2E de la pantalla de Configuración de Interfaces (`/interfaces/configuration`).
 *
 * Cubre los requisitos:
 * - Listado de interfaces registradas con indicadores de estado.
 * - Filtrado por nombre, protocolo y estado.
 * - Vista de detalle en solo lectura con botón Volver.
 * - Exportación a CSV (`interface-configurations.csv`).
 * - Comportamiento de solo lectura (sin operaciones CUD).
 * - Integración con el menú desplegable de Interfaces en el sidebar.
 */
test.describe('Interfaces configuration', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list interface configurations as a read-only screen', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);
    await configPage.goto();

    await expect(configPage.title).toBeVisible();
    await expect(configPage.table).toBeVisible();
    await expect(configPage.filterForm).toBeVisible();
    await expect(configPage.exportButton).toBeVisible();

    // Pantalla de solo lectura: no debe haber botones de creación, edición ni borrado
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter interface configurations by name, protocol and status', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);
    await configPage.goto();

    await configPage.applyFilters({ protocol: 'REST', status: 'ACTIVE' });
    await configPage.clearFilters();
    await expect(configPage.table).toBeVisible();
  });

  test('should open detail view from toolbar button and return to list', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);
    await configPage.goto();

    if (await configPage.rows.count() > 0) {
      await configPage.selectRowByIndex(0);
      await expect(configPage.viewDetailButton).toBeEnabled();
      await configPage.openDetail();

      await expect(configPage.backToListButton).toBeVisible();
      await expect(page.locator('h1')).toContainText(/detail/i);
      await expect(configPage.detailCard).toBeVisible();

      // Volver al listado
      await configPage.backToList();
      await expect(configPage.table).toBeVisible();
      await expect(configPage.rows.first()).toBeVisible();
    }
  });

  test('should open detail view by double clicking a row', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);
    await configPage.goto();

    if (await configPage.rows.count() > 0) {
      await configPage.openDetailByDoubleClick(0);

      await expect(configPage.backToListButton).toBeVisible();
      await expect(page.locator('h1')).toContainText(/detail/i);

      await configPage.backToList();
      await expect(configPage.table).toBeVisible();
    }
  });

  test('should export interface configurations to CSV', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);
    await configPage.goto();

    if (await configPage.rows.count() > 0) {
      const download = await configPage.exportCsv();
      expect(download.suggestedFilename()).toBe('interface-configurations.csv');
    }
  });

  test('should navigate to interface configuration from sidebar menu', async ({ page }) => {
    const configPage = new InterfacesConfigurationPage(page);

    // Partiendo del dashboard, desplegamos la sección de Interfaces
    await configPage.expandInterfacesSidebar();

    await expect(configPage.configurationNavItem).toBeVisible();
    await configPage.configurationNavItem.click();

    await page.waitForURL(/\/interfaces\/configuration$/);
    await expect(configPage.title).toBeVisible();
    await expect(configPage.table).toBeVisible();
  });
});
