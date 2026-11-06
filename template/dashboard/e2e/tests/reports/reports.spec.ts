import { test, expect } from '@playwright/test';

import {
  API_URL,
  apiCreateProfile,
  apiCreateUser,
  apiDeleteProfile,
  apiDeleteUserByUsername,
  apiLogin,
  authHeaders,
} from '../../fixtures/api-client';
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

/**
 * Tests E2E del control de acceso a informes (SEC-08).
 *
 * Cubre RNF-RPT-8 y el caso TC-RPT-11: la lectura del catálogo requiere
 * `REPORT_READ`, la ejecución/exportación sigue requiriendo `REPORT_EXECUTE`
 * y, además, el informe debe estar asignado al usuario (`user2report`) para
 * consultar sus filtros, verlo en el menú y poder ejecutarlo.
 *
 * El setup crea perfiles y usuarios aislados vía API con el administrador; el
 * teardown los elimina. Requiere el backend de integración levantado.
 */
test.describe.serial('Reports access control (SEC-08)', () => {
  const suffix = Date.now().toString().slice(-8);
  const password = 'Test1234!';
  // Solo REPORT_READ, sin informes asignados.
  const readerUser = `e2e_rpt_reader_${suffix}`;
  // REPORT_READ + informe 1 asignado.
  const assignedUser = `e2e_rpt_assigned_${suffix}`;
  // REPORT_EXECUTE + informe 1 asignado (sin REPORT_READ).
  const executorUser = `e2e_rpt_exec_${suffix}`;
  const profileIds: number[] = [];

  const reportsUrl = `${API_URL}/reports`;

  let adminToken: string;
  let readerToken: string;
  let assignedToken: string;
  let executorToken: string;

  test.beforeAll(async ({ playwright }) => {
    // Setup: perfiles de solo lectura y de solo ejecución, y usuarios de prueba
    const request = await playwright.request.newContext();
    adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);

    const readerProfile = await apiCreateProfile(request, adminToken, `e2e_rpt_reader_${suffix}`, [
      'REPORT_READ',
    ]);
    const executorProfile = await apiCreateProfile(request, adminToken, `e2e_rpt_exec_${suffix}`, [
      'REPORT_EXECUTE',
    ]);
    profileIds.push(readerProfile, executorProfile);

    await apiCreateUser(request, adminToken, { username: readerUser, password, profileId: readerProfile });
    await apiCreateUser(request, adminToken, {
      username: assignedUser,
      password,
      profileId: readerProfile,
      reportIds: [1],
    });
    await apiCreateUser(request, adminToken, {
      username: executorUser,
      password,
      profileId: executorProfile,
      reportIds: [1],
    });

    readerToken = await apiLogin(request, readerUser, password);
    assignedToken = await apiLogin(request, assignedUser, password);
    executorToken = await apiLogin(request, executorUser, password);
    await request.dispose();
  });

  test.afterAll(async ({ playwright }) => {
    // Teardown: eliminar usuarios y perfiles de prueba
    const request = await playwright.request.newContext();
    for (const username of [readerUser, assignedUser, executorUser]) {
      await apiDeleteUserByUsername(request, adminToken, username);
    }
    for (const profileId of profileIds) {
      await apiDeleteProfile(request, adminToken, profileId);
    }
    await request.dispose();
  });

  test('TC-RPT-11 should forbid the catalog without REPORT_READ', async ({ request }) => {
    // REPORT_EXECUTE no concede acceso de lectura al catálogo
    const all = await request.get(`${reportsUrl}/all`, { headers: authHeaders(executorToken) });
    expect(all.status()).toBe(403);

    const search = await request.get(`${reportsUrl}/search`, {
      headers: authHeaders(executorToken),
      params: { page: 0, size: 10 },
    });
    expect(search.status()).toBe(403);
  });

  test('TC-RPT-11 should allow the catalog with REPORT_READ', async ({ request }) => {
    const all = await request.get(`${reportsUrl}/all`, { headers: authHeaders(readerToken) });
    expect(all.status()).toBe(200);

    const search = await request.get(`${reportsUrl}/search`, {
      headers: authHeaders(readerToken),
      params: { page: 0, size: 10 },
    });
    expect(search.status()).toBe(200);
  });

  test('TC-RPT-11 should only list the reports assigned to the user', async ({ request }) => {
    // Con asignación: el informe 1 aparece
    const assigned = await request.get(reportsUrl, { headers: authHeaders(assignedToken) });
    expect(assigned.status()).toBe(200);
    const assignedBody = (await assigned.json()) as { id: number }[];
    expect(assignedBody.map((report) => report.id)).toContain(1);

    // Sin asignación: no se devuelve ningún informe
    const unassigned = await request.get(reportsUrl, { headers: authHeaders(readerToken) });
    expect(unassigned.status()).toBe(200);
    expect((await unassigned.json()) as unknown[]).toHaveLength(0);
  });

  test('TC-RPT-11 should deny the filter definitions of an unassigned report', async ({ request }) => {
    // REPORT_READ pero sin asignación → 403
    const denied = await request.get(`${reportsUrl}/1/filters`, {
      headers: authHeaders(readerToken),
    });
    expect(denied.status()).toBe(403);

    // REPORT_READ con el informe asignado → 200
    const allowed = await request.get(`${reportsUrl}/1/filters`, {
      headers: authHeaders(assignedToken),
    });
    expect(allowed.status()).toBe(200);
  });

  test('TC-RPT-11 should require both REPORT_EXECUTE and assignment to execute', async ({
    request,
  }) => {
    // Solo REPORT_READ (aunque el informe esté asignado) → 403 (falta REPORT_EXECUTE)
    const readOnly = await request.post(`${reportsUrl}/1/execute`, {
      headers: authHeaders(assignedToken),
      params: { page: 0, size: 10 },
      data: {},
    });
    expect(readOnly.status()).toBe(403);

    // REPORT_EXECUTE + informe asignado → 200
    const allowed = await request.post(`${reportsUrl}/1/execute`, {
      headers: authHeaders(executorToken),
      params: { page: 0, size: 10 },
      data: {},
    });
    expect(allowed.status()).toBe(200);
  });

  test('TC-RPT-11 should hide unassigned reports in the sidebar menu', async ({ page }) => {
    // Un usuario con REPORT_READ sin informes asignados no ve ningún informe
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(readerUser, password);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    await expect(page.getByTestId('nav-menu.reports')).toBeVisible();
    await expect(page.getByTestId('nav-Informe de actividad mensual')).toHaveCount(0);
  });

  test('TC-RPT-11 should show an assigned report in the sidebar menu', async ({ page }) => {
    // Un usuario con REPORT_READ y el informe asignado lo ve en el menú
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(assignedUser, password);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    await page.getByTestId('nav-toggle-menu.reports').click();
    await expect(page.getByTestId('nav-Informe de actividad mensual')).toBeVisible();
  });
});
