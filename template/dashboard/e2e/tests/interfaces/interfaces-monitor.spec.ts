import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { InterfacesMonitorPage } from '../../pages/interfaces-monitor.page';

/**
 * Tests E2E del Monitor de Interfaces (`/interfaces/monitor`).
 *
 * Cubre los requisitos:
 * - RF-IFM-1: Consulta paginada y ordenable de logs de operaciones.
 * - RF-IFM-2: Filtrado multicriterio por tipo de operación, interfaz y estado.
 * - RF-IFM-3: Detalle de operación con payloads y botón Volver.
 * - RF-IFM-4: Exportación completa a CSV.
 * - RNF-IFM-1 / RNF-IFM-2: Pantalla de solo lectura (sin acciones CUD).
 * - Integración con el menú desplegable de Interfaces en el sidebar.
 */
test.describe('Interfaces monitor', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list interface logs as a read-only screen', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    await expect(monitorPage.title).toBeVisible();
    await expect(monitorPage.table).toBeVisible();
    await expect(monitorPage.rows.first()).toBeVisible();
    expect(await monitorPage.rows.count()).toBeGreaterThan(0);

    await expect(monitorPage.applyFiltersButton).toBeVisible();
    await expect(monitorPage.clearFiltersButton).toBeVisible();
    await expect(monitorPage.exportButton).toBeVisible();

    // Pantalla de solo lectura: no debe existir creación, edición ni eliminación
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter interface logs by operation type and status', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    // Filtrar por operación POST y estado ERROR
    await monitorPage.applyFilters({ operationType: 'POST', status: 'ERROR' });

    if (await monitorPage.rows.count() > 0) {
      await expect(monitorPage.rows.first()).toBeVisible();
      await expect(monitorPage.rows.first()).toContainText('POST');
      await expect(monitorPage.rows.first()).toContainText('ERROR');
    }

    // Limpiar filtros y comprobar que se recarga
    await monitorPage.clearFilters();
    await expect(monitorPage.rows.first()).toBeVisible();
    expect(await monitorPage.rows.count()).toBeGreaterThan(0);
  });

  test('should open detail view from toolbar button and return to list', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    const selectedRow = monitorPage.rows.first();
    const cells = await selectedRow.locator('td').allTextContents();

    await monitorPage.selectRowByIndex(0);
    await expect(monitorPage.viewDetailButton).toBeEnabled();
    await monitorPage.openDetail();

    await expect(monitorPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/detail/i);

    // Verificar que los datos principales coinciden con la fila seleccionada
    const detailContent = await monitorPage.detailCard.textContent();
    expect(detailContent).toContain(cells[1].trim()); // operationType
    expect(detailContent).toContain(cells[2].trim()); // interfaceName
    expect(detailContent).toContain(cells[3].trim()); // status

    // Volver al listado
    await monitorPage.backToList();
    await expect(monitorPage.table).toBeVisible();
    await expect(monitorPage.rows.first()).toBeVisible();
  });

  test('should open detail view by double clicking a row', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    await monitorPage.openDetailByDoubleClick(0);

    await expect(monitorPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/detail/i);

    await monitorPage.backToList();
    await expect(monitorPage.table).toBeVisible();
  });

  test('should change page size and reload data', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    await monitorPage.changePageSize(5);

    await expect(monitorPage.table).toBeVisible();
    const count = await monitorPage.rows.count();
    expect(count).toBeLessThanOrEqual(5);
    expect(count).toBeGreaterThan(0);
  });

  test('should export filtered interface logs to CSV', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);
    await monitorPage.goto();

    await monitorPage.applyFilters({ operationType: 'GET' });

    const download = await monitorPage.exportCsv();
    expect(download.suggestedFilename()).toMatch(/^interfaces_monitor_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('should navigate to interface monitor from sidebar menu', async ({ page }) => {
    const monitorPage = new InterfacesMonitorPage(page);

    // Partiendo del dashboard, desplegamos la sección de Interfaces
    await monitorPage.expandInterfacesSidebar();

    await expect(monitorPage.monitorNavItem).toBeVisible();
    await monitorPage.monitorNavItem.click();

    await page.waitForURL(/\/interfaces\/monitor$/);
    await expect(monitorPage.title).toBeVisible();
    await expect(monitorPage.table).toBeVisible();
  });
});
