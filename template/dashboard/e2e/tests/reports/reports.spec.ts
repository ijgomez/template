import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ReportPage } from '../../pages/report.page';

/**
 * Tests E2E del módulo de Informes (`/reports/:id`).
 *
 * Cubre los requisitos:
 * - RF-RPT-1: Carga de metadatos, cabecera y barra de filtros sin consulta inicial.
 * - RF-RPT-2: Filtros dinámicos y reseteo al limpiar.
 * - RF-RPT-3: Ejecución y visualización de tabla paginada.
 * - RF-RPT-4: Exportación en formatos CSV y TXT.
 * - Integración con el menú de navegación del sidebar.
 */
test.describe.serial('Reports execution', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should display report metadata and not show results table before execution', async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto(1);

    await expect(reportPage.title).toBeVisible();
    await expect(reportPage.title).toContainText('Informe de actividad mensual');
    await expect(reportPage.filterForm).toBeVisible();
    await expect(reportPage.executeButton).toBeVisible();
    await expect(reportPage.clearButton).toBeVisible();

    // La tabla de resultados y botones de exportación no deben mostrarse antes de ejecutar
    await expect(reportPage.table).toHaveCount(0);
    await expect(reportPage.exportCsvButton).toHaveCount(0);
    await expect(reportPage.exportTxtButton).toHaveCount(0);
    await expect(reportPage.exportPdfButton).toHaveCount(0);
    await expect(reportPage.exportXlsxButton).toHaveCount(0);
  });

  test('should execute report and display results with export toolbar', async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto(1);

    await reportPage.execute();

    await expect(reportPage.table).toBeVisible();
    await expect(reportPage.rows.first()).toBeVisible();
    expect(await reportPage.rows.count()).toBeGreaterThan(0);

    // Tras ejecutar, la barra de exportación debe estar visible
    await expect(reportPage.exportCsvButton).toBeVisible();
    await expect(reportPage.exportTxtButton).toBeVisible();
    await expect(reportPage.exportPdfButton).toBeVisible();
    await expect(reportPage.exportXlsxButton).toBeVisible();
  });

  test('should reset results when clicking clear button', async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto(1);

    await reportPage.execute();
    await expect(reportPage.table).toBeVisible();

    await reportPage.clearFilters();

    await expect(reportPage.table).toHaveCount(0);
    await expect(reportPage.exportCsvButton).toHaveCount(0);
  });

  test('should change page size and re-execute', async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto(1);

    await reportPage.execute();
    await expect(reportPage.table).toBeVisible();

    await expect(reportPage.pageSizeSelect).toBeVisible();
    await reportPage.changePageSize(5);

    await expect(reportPage.table).toBeVisible();
    await expect(reportPage.rows.first()).toBeVisible();
  });

  test('should export report to CSV and TXT formats', async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto(1);

    await reportPage.execute();

    // Exportar CSV
    const csvDownload = await reportPage.exportCsv();
    expect(csvDownload.suggestedFilename()).toMatch(/^Informe de actividad mensual_\d{4}-\d{2}-\d{2}\.csv$/);

    // Exportar TXT
    const txtDownload = await reportPage.exportTxt();
    expect(txtDownload.suggestedFilename()).toMatch(/^Informe de actividad mensual_\d{4}-\d{2}-\d{2}\.txt$/);
  });

  test('should navigate to report from sidebar menu', async ({ page }) => {
    const reportPage = new ReportPage(page);

    // Partiendo del dashboard, abrimos el menú lateral de informes
    await reportPage.expandReportsSidebar();

    const reportItem = reportPage.reportNavItem('Informe de actividad mensual');
    await expect(reportItem).toBeVisible();
    await reportItem.click();

    await page.waitForURL(/\/reports\/1$/);
    await expect(reportPage.title).toContainText('Informe de actividad mensual');
    await expect(reportPage.filterForm).toBeVisible();
  });
});
