import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { InterfaceListPage } from '../../pages/interface-list.page';

/**
 * Tests E2E del Listado de Interfaces (`/interfaces/monitor`).
 *
 * Cubre los requisitos:
 * - RF-IFM-1: Consulta paginada y ordenable de logs de operaciones.
 * - RF-IFM-2: Filtrado multicriterio por tipo de operación, interfaz y estado.
 * - RF-IFM-3: Detalle de operación con payloads y botón Volver.
 * - RF-IFM-4: Exportación completa a CSV.
 * - RNF-IFM-1 / RNF-IFM-2: Pantalla de solo lectura (sin acciones CUD).
 * - Integración con el menú desplegable de Interfaces en el sidebar.
 */
test.describe('Interface list', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list interface logs as a read-only screen', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    await expect(interfaceListPage.title).toBeVisible();
    await expect(interfaceListPage.table).toBeVisible();
    await expect(interfaceListPage.rows.first()).toBeVisible();
    expect(await interfaceListPage.rows.count()).toBeGreaterThan(0);

    await expect(interfaceListPage.applyFiltersButton).toBeVisible();
    await expect(interfaceListPage.clearFiltersButton).toBeVisible();
    await expect(interfaceListPage.exportButton).toBeVisible();

    // Pantalla de solo lectura: no debe existir creación, edición ni eliminación
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter interface logs by operation type and status', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    // Filtrar por operación POST y estado ERROR
    await interfaceListPage.applyFilters({ operationType: 'POST', status: 'ERROR' });

    if (await interfaceListPage.rows.count() > 0) {
      await expect(interfaceListPage.rows.first()).toBeVisible();
      await expect(interfaceListPage.rows.first()).toContainText('POST');
      await expect(interfaceListPage.rows.first()).toContainText('ERROR');
    }

    // Limpiar filtros y comprobar que se recarga
    await interfaceListPage.clearFilters();
    await expect(interfaceListPage.rows.first()).toBeVisible();
    expect(await interfaceListPage.rows.count()).toBeGreaterThan(0);
  });

  test('should open detail view from toolbar button and return to list', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    const selectedRow = interfaceListPage.rows.first();
    const cells = await selectedRow.locator('td').allTextContents();

    await interfaceListPage.selectRowByIndex(0);
    await expect(interfaceListPage.viewDetailButton).toBeEnabled();
    await interfaceListPage.openDetail();

    await expect(interfaceListPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/detail/i);

    // Verificar que los datos principales coinciden con la fila seleccionada
    const detailContent = await interfaceListPage.detailCard.textContent();
    expect(detailContent).toContain(cells[1].trim()); // operationType
    expect(detailContent).toContain(cells[2].trim()); // interfaceName
    expect(detailContent).toContain(cells[3].trim()); // status

    // Volver al listado
    await interfaceListPage.backToList();
    await expect(interfaceListPage.table).toBeVisible();
    await expect(interfaceListPage.rows.first()).toBeVisible();
  });

  test('should open detail view by double clicking a row', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    await interfaceListPage.openDetailByDoubleClick(0);

    await expect(interfaceListPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/detail/i);

    await interfaceListPage.backToList();
    await expect(interfaceListPage.table).toBeVisible();
  });

  test('should change page size and reload data', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    await interfaceListPage.changePageSize(5);

    await expect(interfaceListPage.table).toBeVisible();
    const count = await interfaceListPage.rows.count();
    expect(count).toBeLessThanOrEqual(5);
    expect(count).toBeGreaterThan(0);
  });

  test('should export filtered interface logs to CSV', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);
    await interfaceListPage.goto();

    await interfaceListPage.applyFilters({ operationType: 'GET' });

    const download = await interfaceListPage.exportCsv();
    expect(download.suggestedFilename()).toMatch(/^interfaces_monitor_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('should navigate to interface list from sidebar menu', async ({ page }) => {
    const interfaceListPage = new InterfaceListPage(page);

    // Partiendo del dashboard, desplegamos la sección de Interfaces
    await interfaceListPage.expandInterfacesSidebar();

    await expect(interfaceListPage.interfaceListNavItem).toBeVisible();
    await interfaceListPage.interfaceListNavItem.click();

    await page.waitForURL(/\/interfaces\/monitor$/);
    await expect(interfaceListPage.title).toBeVisible();
    await expect(interfaceListPage.table).toBeVisible();
  });
});
