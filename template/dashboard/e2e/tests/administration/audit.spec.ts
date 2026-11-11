import { readFile } from 'node:fs/promises';
import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';
import { API_URL, apiLogin, authHeaders } from '../../fixtures/api-client';
import { LoginPage } from '../../pages/login.page';
import { AuditPage } from '../../pages/audit.page';

/**
 * Tests E2E de la pantalla de auditoría (`/administration/audit`).
 *
 * Cada test se identifica con su caso de `audit.md` (TC-AUD-01..07).
 *
 * El inicio de sesión de cada caso deja una entrada `EXECUTE` de la sección
 * `SECURITY` para el usuario administrador. La suite solo consulta y exporta:
 * no crea, modifica ni elimina registros de auditoría.
 *
 * Requiere el backend de integración levantado y que el usuario administrador
 * posea la acción `SYSTEM_LOG_READ`.
 */

const AUDIT_PATH = '/administration/audit';
const ADMIN = testUsers.valid;
/** Tamaño de página que usa `AuditService.findAllByCriteria` para exportar sin paginación. */
const EXPORT_PAGE_SIZE = 100000;

interface AuditLogJson {
  timestamp: string;
  username: string;
  operationType: string;
  section: string;
}

interface AuditPageJson {
  content: AuditLogJson[];
  page: { totalElements: number };
}

async function loginAsAdmin(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndWaitForDashboard(ADMIN.username, ADMIN.password);
}

async function openAuditPage(page: Page): Promise<AuditPage> {
  const auditPage = new AuditPage(page);
  await auditPage.goto();
  return auditPage;
}

/**
 * Repite por API la misma consulta (URL y parámetros) que lanzó la pantalla y devuelve su página.
 * Se evita leer el cuerpo desde el navegador: el filtrado automático con debounce lanza peticiones
 * duplicadas y Chromium puede descartar el cuerpo de alguna (`Network.getResponseBody`).
 */
async function replayQuery(request: APIRequestContext, response: Response): Promise<AuditPageJson> {
  const token = await apiLogin(request, ADMIN.username, ADMIN.password);
  const replay = await request.get(response.url(), { headers: authHeaders(token) });
  expect(replay.status()).toBe(200);
  return (await replay.json()) as AuditPageJson;
}

/** Día local `YYYY-MM-DD` en la zona horaria indicada, desplazado `offsetDays` días. */
function localDay(timeZone: string, offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

test.describe('Audit log', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-AUD-01 should list audit logs read-only with sorting and pagination', async ({ page }) => {
    // Arrange & Act
    const auditPage = await openAuditPage(page);

    // Assert: tabla, filtros y columnas visibles; sin acciones CRUD
    await expect(auditPage.table).toBeVisible();
    await expect(auditPage.filterForm).toBeVisible();
    expect(await auditPage.rows.count()).toBeGreaterThan(0);
    for (const key of ['timestamp', 'username', 'operationType', 'section', 'entityName', 'entityId', 'detail']) {
      await expect(auditPage.columnHeader(key)).toBeVisible();
    }
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);

    // Act & Assert: ordenación ascendente y descendente
    await auditPage.sortBy('timestamp', 'timestamp,asc');
    await expect(auditPage.columnHeader('timestamp')).toHaveAttribute('aria-sort', 'ascending');
    await auditPage.sortBy('timestamp', 'timestamp,desc');
    await expect(auditPage.columnHeader('timestamp')).toHaveAttribute('aria-sort', 'descending');

    // Act & Assert: tamaños de página disponibles y cambio a 5
    const options = await auditPage.pageSizeSelect.locator('option').allTextContents();
    expect(options.map((option) => option.trim())).toEqual(['5', '10', '20', '50']);
    await auditPage.setPageSize(5);
    expect(await auditPage.rows.count()).toBeLessThanOrEqual(5);

    // Act & Assert: navegación a la página siguiente cuando existe
    if (await auditPage.nextPageButton.isEnabled()) {
      await auditPage.goToNextPage();
      await expect(auditPage.rows.first()).toBeVisible();
    }
  });

  test('TC-AUD-02 should filter by username, operation and section and reset on clear', async ({ page, request }) => {
    // Arrange: situarse en la página 2 para comprobar que filtrar vuelve a la 1
    const auditPage = await openAuditPage(page);
    await auditPage.setPageSize(5);
    if (await auditPage.nextPageButton.isEnabled()) {
      await auditPage.goToNextPage();
    }

    // Act: usuario con mayúsculas (coincidencia parcial sin distinguir mayúsculas)
    const filtered = auditPage.waitForAuditQuery({ page: 0 });
    await auditPage.applyFilters({
      username: ADMIN.username.slice(0, 3).toUpperCase(),
      operationType: 'EXECUTE',
      section: 'SECURITY',
    });
    const body = await replayQuery(request, await filtered);

    // Assert: todas las filas coinciden con los filtros
    expect(body.content.length).toBeGreaterThan(0);
    for (const log of body.content) {
      expect(log.username.toLowerCase()).toContain(ADMIN.username.slice(0, 3).toLowerCase());
      expect(log.operationType).toBe('EXECUTE');
      expect(log.section).toBe('SECURITY');
    }
    await expect(auditPage.rows.first()).toContainText('EXECUTE');
    await expect(auditPage.rows.first()).toContainText('SECURITY');

    // Act & Assert: limpiar restablece los campos y recarga sin criterios
    const cleared = auditPage.waitForAuditQuery({ page: 0 });
    await auditPage.clearFilters();
    const clearedUrl = new URL((await cleared).url());
    for (const param of ['username', 'operationType', 'section', 'fromDate', 'toDate']) {
      expect(clearedUrl.searchParams.has(param), `parámetro ${param} tras limpiar`).toBe(false);
    }
    await expect(auditPage.filterUsername).toHaveValue('');
    await expect(auditPage.filterOperationType).toHaveValue('');
    await expect(auditPage.filterSection).toHaveValue('');
    await expect(auditPage.filterDateFrom).toHaveValue('');
    await expect(auditPage.filterDateTo).toHaveValue('');
  });

  test.describe('TC-AUD-03 date range filter in the browser time zone', () => {
    // Zona fija UTC+14 sin horario de verano: el día local del navegador difiere del día UTC,
    // lo que permite comprobar que el filtro y la presentación usan la zona del navegador.
    const TIME_ZONE = 'Pacific/Kiritimati';
    const OFFSET_HOURS = 14;
    test.use({ timezoneId: TIME_ZONE, locale: 'es-ES' });

    /** Instante UTC de las 00:00 locales del día `YYYY-MM-DD` (+`addDays`) en UTC+14. */
    function utcStartOfLocalDay(day: string, addDays = 0): string {
      const [year, month, date] = day.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, date + addDays) - OFFSET_HOURS * 3_600_000).toISOString();
    }

    test('TC-AUD-03 step 1: last 7 days sends the UTC range and includes today', async ({ page, request }) => {
      // Arrange
      const auditPage = await openAuditPage(page);
      const from = localDay(TIME_ZONE, -7);
      const to = localDay(TIME_ZONE);

      // Act
      const response = await auditPage.applyDateRange(from, to);

      // Assert: rango semiabierto [00:00 local de "desde", 00:00 local del día siguiente a "hasta")
      const params = new URL(response.url()).searchParams;
      expect(params.get('fromDate')).toBe(utcStartOfLocalDay(from));
      expect(params.get('toDate')).toBe(utcStartOfLocalDay(to, 1));
      const body = await replayQuery(request, response);
      expect(body.content.length).toBeGreaterThan(0);
      for (const log of body.content) {
        const instant = Date.parse(log.timestamp);
        expect(instant).toBeGreaterThanOrEqual(Date.parse(params.get('fromDate')!));
        expect(instant).toBeLessThan(Date.parse(params.get('toDate')!));
      }
      await expect(auditPage.rows.first()).toBeVisible();
    });

    test('TC-AUD-03 step 2: today only shows today entries in local time', async ({ page, request }) => {
      // Arrange
      const auditPage = await openAuditPage(page);
      const today = localDay(TIME_ZONE);

      // Act
      await auditPage.applyDateRange(today, today);
      // Orden ascendente: la primera fila (la más antigua de hoy) no cambia aunque otros tests
      // en paralelo generen nuevas entradas.
      const sorted = await auditPage.sortBy('timestamp', 'timestamp,asc');

      // Assert: aparece el login del setup y la hora se muestra en la zona del navegador
      const body = await replayQuery(request, sorted);
      expect(new URL(sorted.url()).searchParams.get('fromDate')).toBe(utcStartOfLocalDay(today));
      expect(
        body.content.some((log) => log.username === ADMIN.username && log.operationType === 'EXECUTE'),
      ).toBe(true);
      const first = new Date(body.content[0].timestamp);
      const expectedLocal =
        `${first.toLocaleDateString('es-ES', { timeZone: TIME_ZONE })} ` +
        `${first.toLocaleTimeString('es-ES', { timeZone: TIME_ZONE })}`;
      const utcRendering = first.toLocaleTimeString('es-ES', { timeZone: 'UTC' });
      const timestampCell = auditPage.rows.first().locator('td').first();
      await expect(timestampCell).toHaveText(expectedLocal);
      await expect(timestampCell).not.toContainText(utcRendering);
    });

    test('TC-AUD-03: a range without entries shows an empty list', async ({ page, request }) => {
      const auditPage = await openAuditPage(page);

      const response = await auditPage.applyDateRange('2000-01-01', '2000-01-02');

      const body = await replayQuery(request, response);
      expect(body.page.totalElements).toBe(0);
      await expect(auditPage.rows).toHaveCount(0);
    });

    test('TC-AUD-03: an inverted range is flagged and cannot be applied', async ({ page }) => {
      const auditPage = await openAuditPage(page);

      await auditPage.filterDateFrom.fill('2026-02-10');
      await auditPage.filterDateTo.fill('2026-02-01');

      await expect(auditPage.dateRangeError).toBeVisible();
      await expect(auditPage.applyFiltersButton).toBeDisabled();
    });
  });

  test('TC-AUD-04 should open the detail read-only and clear the selection on back', async ({ page }) => {
    // Arrange
    const auditPage = await openAuditPage(page);
    const selectedRow = auditPage.rows.first();
    const cells = await selectedRow.locator('td').allTextContents();

    // Act: seleccionar la fila y pulsar Detalle
    await auditPage.openDetail(selectedRow);

    // Assert: detalle con los datos de la fila y sin acciones CRUD
    await expect(page.locator('h1')).toContainText(/audit/i);
    const detail = page.locator('.card .card-body');
    for (const value of [cells[0], cells[1], cells[2], cells[3], cells[4], cells[6]]) {
      if (value?.trim()) {
        await expect(detail).toContainText(value.trim());
      }
    }
    for (const testId of ['btn-create', 'btn-edit', 'btn-delete', 'btn-save']) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    // Act & Assert: Volver restaura el listado sin selección
    await auditPage.backToList();
    await expect(auditPage.filterForm).toBeVisible();
    await expect(auditPage.selectedRows).toHaveCount(0);
    await expect(auditPage.viewDetailButton).toBeDisabled();
  });

  test('TC-AUD-04 should open the detail by double click', async ({ page }) => {
    const auditPage = await openAuditPage(page);

    await auditPage.openDetailByDoubleClick(auditPage.rows.first());
    await expect(auditPage.backToListButton).toBeVisible();

    await auditPage.backToList();
    await expect(auditPage.rows.first()).toBeVisible();
  });

  test('TC-AUD-05 should export every filtered row to CSV, not only the visible page', async ({ page }) => {
    // Arrange: página de 5 filas filtrada por el administrador
    const auditPage = await openAuditPage(page);
    await auditPage.setPageSize(5);
    await auditPage.applyFilters({ username: ADMIN.username });

    // Act: la exportación consulta todas las filas filtradas ignorando la paginación
    const exportQuery = auditPage.waitForAuditQuery({ hasParam: 'username', size: EXPORT_PAGE_SIZE });
    const download = await auditPage.exportCsv();
    const exportUrl = new URL((await exportQuery).url());

    // Assert: nombre audit_YYYY-MM-DD.csv y cabecera con las 7 columnas
    expect(download.suggestedFilename()).toMatch(/^audit_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(exportUrl.searchParams.get('username')).toBe(ADMIN.username);
    const csv = (await readFile((await download.path())!, 'utf-8')).replace(/^\uFEFF/, '');
    const [header, ...records] = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
    expect(header.split(/[;,]/).length).toBeGreaterThanOrEqual(7);

    // Assert: todas las filas son del usuario filtrado y hay más que las 5 de la página visible
    // (cada login del administrador deja una entrada de auditoría)
    expect(records.length).toBeGreaterThan(5);
    expect(records.every((line) => line.includes(ADMIN.username))).toBe(true);
  });

  test('TC-AUD-05 should notify when there is no data to export', async ({ page }) => {
    // Arrange: filtro sin coincidencias
    const auditPage = await openAuditPage(page);
    await auditPage.applyFilters({ username: `no-such-user-${Date.now()}` });
    await expect(auditPage.rows).toHaveCount(0);
    let downloaded = false;
    page.on('download', () => {
      downloaded = true;
    });

    // Act
    await auditPage.exportButton.click();

    // Assert: aviso de que no hay datos y sin descarga
    await expect(auditPage.errorDialog).toBeVisible();
    await expect(auditPage.errorDialog).toContainText(/No hay datos que exportar|No data to export/);
    expect(downloaded).toBe(false);
  });
});

test.describe('Audit log API', () => {
  test('TC-AUD-06 should only expose read endpoints', async ({ request }) => {
    // Arrange
    const token = await apiLogin(request, ADMIN.username, ADMIN.password);
    const headers = authHeaders(token);
    const url = `${API_URL}${AUDIT_PATH}`;

    // Act & Assert: lectura permitida
    expect((await request.get(url, { headers })).status()).toBe(200);
    expect((await request.get(`${url}/count`, { headers })).status()).toBe(200);

    // Act & Assert: escritura rechazada (denyAll → 403; sin handler → 405)
    const body = { username: 'tampered', operationType: 'DELETE', section: 'SYSTEM' };
    for (const response of [
      await request.post(url, { headers, data: body }),
      await request.put(`${url}/1`, { headers, data: body }),
      await request.patch(`${url}/1`, { headers, data: body }),
      await request.delete(`${url}/1`, { headers }),
    ]) {
      expect([403, 405]).toContain(response.status());
    }
  });

  test('TC-AUD-07 should record the login as an EXECUTE/SECURITY audit entry', async ({ page, request }) => {
    // Arrange: instante previo al login (margen de 2 s por resolución de reloj)
    const since = new Date(Date.now() - 2_000).toISOString();

    // Act: login por la UI (operación auditable) y consulta filtrada
    await loginAsAdmin(page);
    const auditPage = await openAuditPage(page);
    await auditPage.applyFilters({ username: ADMIN.username, operationType: 'EXECUTE', section: 'SECURITY' });

    // Assert: existe una entrada generada tras el login
    const token = await apiLogin(request, ADMIN.username, ADMIN.password);
    const response = await request.get(`${API_URL}${AUDIT_PATH}`, {
      headers: authHeaders(token),
      params: { username: ADMIN.username, operationType: 'EXECUTE', section: 'SECURITY', fromDate: since },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as AuditPageJson;
    expect(body.page.totalElements).toBeGreaterThan(0);
    await expect(auditPage.rows.first()).toContainText(ADMIN.username);
    await expect(auditPage.rows.first()).toContainText('EXECUTE');
  });
});
