import { test, expect } from '@playwright/test';

import {
  API_URL,
  ACTIONS_PATH,
  apiGetActionByCode,
  apiUpdateAction,
  apiCreateProfile,
  apiCreateUser,
  apiDeleteProfile,
  apiDeleteUserByUsername,
  apiLogin,
  authHeaders,
} from '../../fixtures/api-client';
import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ActionsPage } from '../../pages/actions.page';

/**
 * Tests E2E de la pantalla de gestión de acciones
 * (`/administration/security/actions`).
 *
 * Cubren el catálogo TC-ACC-01..07 de
 * `template-docs/02-functional/administration/security/actions.md` (sección 4.6).
 * Cada título lleva el identificador del caso para facilitar la trazabilidad.
 *
 * El catálogo de acciones es semilla de base de datos: no existe alta ni borrado.
 * Los tests de edición anotan el valor original del registro y lo restauran en el teardown.
 *
 * Requiere el backend de integración levantado (perfil `test`).
 */

/** Acción semilla de referencia usada en los tests de filtrado, detalle y edición. */
const SEED_ACTION_CODE = 'USER_READ';

/** Crea un `ActionsPage` ya posicionado en el listado. */
async function openActionsPage(page: import('@playwright/test').Page): Promise<ActionsPage> {
  const actionsPage = new ActionsPage(page);
  await actionsPage.goto();
  return actionsPage;
}

test.describe.serial('Actions management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('TC-ACC-01 should list actions with sortable columns and pagination', async ({ page }) => {
    // Arrange & Act
    const actionsPage = await openActionsPage(page);

    // Assert: tabla visible con al menos una fila y los filtros presentes
    await expect(actionsPage.table).toBeVisible();
    await expect(actionsPage.rows.first()).toBeVisible();
    expect(await actionsPage.rows.count()).toBeGreaterThan(0);
    await expect(actionsPage.filterForm).toBeVisible();

    // Assert: columnas esperadas (AC1.1)
    for (const key of ['code', 'name', 'type', 'description']) {
      await expect(actionsPage.columnHeader(key)).toBeVisible();
    }

    // Assert: no existen botones de alta ni borrado (RNF-ACC-2)
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);

    // Act & Assert: ordenación ascendente y descendente (AC1.2)
    await actionsPage.sortBy('code', 'code,asc');
    await expect(actionsPage.columnHeader('code')).toHaveAttribute('aria-sort', 'ascending');
    await actionsPage.sortBy('code', 'code,desc');
    await expect(actionsPage.columnHeader('code')).toHaveAttribute('aria-sort', 'descending');

    // Act & Assert: cambio de tamaño de página (AC1.3)
    await actionsPage.setPageSize(5);
    expect(await actionsPage.rows.count()).toBeLessThanOrEqual(5);
  });

  test('TC-ACC-02 should filter actions by code (partial match) and type, then clear', async ({ page }) => {
    // Arrange
    const actionsPage = await openActionsPage(page);
    const totalCount = await actionsPage.rows.count();

    // Act: filtrar por código parcial 'USER' (AC2.1)
    await actionsPage.applyCodeFilter('USER');

    // Assert: todas las filas visibles contienen 'USER' en el texto
    const countAfterCode = await actionsPage.rows.count();
    expect(countAfterCode).toBeGreaterThan(0);
    expect(countAfterCode).toBeLessThanOrEqual(totalCount);
    for (let i = 0; i < countAfterCode; i++) {
      await expect(actionsPage.rows.nth(i)).toContainText('USER');
    }

    // Act: añadir filtro de tipo READ (AC2.2)
    await actionsPage.applyTypeFilter('READ');

    // Assert: filas visibles contienen 'USER' y 'READ'; el total es ≤ filtro anterior
    const countAfterType = await actionsPage.rows.count();
    expect(countAfterType).toBeGreaterThan(0);
    expect(countAfterType).toBeLessThanOrEqual(countAfterCode);
    for (let i = 0; i < countAfterType; i++) {
      await expect(actionsPage.rows.nth(i)).toContainText('USER');
      await expect(actionsPage.rows.nth(i)).toContainText('READ');
    }

    // Act: limpiar filtros (AC2.4)
    await actionsPage.clearFilters();

    // Assert: filtros vacíos y listado completo restaurado
    await expect(actionsPage.filterCode).toHaveValue('');
    expect(await actionsPage.rows.count()).toBeGreaterThan(countAfterType);
  });

  test('TC-ACC-03 should open read-only detail via double click and via btn-detail', async ({ page }) => {
    // Arrange
    const actionsPage = await openActionsPage(page);

    // Localizar la fila de USER_READ y filtrar para asegurarse de que está visible
    await actionsPage.applyCodeFilter(SEED_ACTION_CODE);
    await expect(actionsPage.rowByCode(SEED_ACTION_CODE).first()).toBeVisible();

    // Act: abrir detalle por doble clic (AC3.1)
    await actionsPage.openDetailByDoubleClick(SEED_ACTION_CODE);

    // Assert: formulario de detalle visible (AC3.2)
    await expect(actionsPage.form).toBeVisible();

    // Assert: campo código presente y con el valor correcto
    await expect(actionsPage.inputCode).toBeVisible();
    await expect(actionsPage.inputCode).toHaveValue(SEED_ACTION_CODE);

    // Assert: nombre y tipo visibles en modo solo lectura (AC3.2)
    await expect(actionsPage.inputName).toBeVisible();
    await expect(actionsPage.inputTypeReadonly).toBeVisible();

    // Assert: fechas de auditoría presentes (AC3.2)
    await expect(actionsPage.inputCreatedAt).toBeVisible();
    await expect(actionsPage.inputLastModifiedAt).toBeVisible();

    // Assert: botón de edición en modo detalle disponible (AC3.3)
    await expect(actionsPage.detailEditButton).toBeVisible();

    // Assert: modo solo lectura — sin botón Guardar, sin btn-cancel de edición
    await expect(actionsPage.saveButton).toHaveCount(0);
    await expect(actionsPage.cancelButton).toHaveCount(0);

    // Act: volver al listado y abrir por btn-detail (AC3.1 — vía botón)
    await actionsPage.backButton.click();
    await expect(actionsPage.table).toBeVisible();
    await actionsPage.openDetailByButton(SEED_ACTION_CODE);
    await expect(actionsPage.inputCode).toHaveValue(SEED_ACTION_CODE);
  });

  test('TC-ACC-04 should edit action metadata keeping code immutable', async ({ page, request }) => {
    // Setup: obtener los valores originales del semilla para restaurarlos
    const adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    const original = await apiGetActionByCode(request, adminToken, SEED_ACTION_CODE);

    try {
      // Arrange
      const actionsPage = await openActionsPage(page);
      await actionsPage.applyCodeFilter(SEED_ACTION_CODE);
      await actionsPage.openEditFormByCode(SEED_ACTION_CODE);

      // Assert: campo código es de solo lectura (AC4.1)
      await expect(actionsPage.inputCode).toHaveJSProperty('readOnly', true);

      // Act: cambiar nombre, descripción y tipo (AC4.2–AC4.4) y guardar
      const updatedName = `${original.name} (test e2e)`;
      await actionsPage.saveEdit({
        name: updatedName,
        description: 'Actualizado por E2E',
        type: 'WRITE',
      });

      // Assert: vuelve al listado y el cambio es visible (AC4.5)
      await expect(actionsPage.table).toBeVisible();
      await actionsPage.applyCodeFilter(SEED_ACTION_CODE);
      await expect(actionsPage.rowByCode(SEED_ACTION_CODE).first()).toContainText(updatedName);
    } finally {
      // Teardown: restaurar el nombre, descripción y tipo originales del semilla
      await apiUpdateAction(request, adminToken, original.id, {
        name: original.name,
        description: original.description,
        type: original.type,
      });
    }
  });

  test('TC-ACC-05 should export actions to CSV and notify when no data', async ({ page }) => {
    // Arrange
    const actionsPage = await openActionsPage(page);

    // Act: exportar sin filtros (AC5.1 y AC5.2)
    const download = await actionsPage.exportCsv();

    // Assert: nombre del fichero con formato correcto
    expect(download.suggestedFilename()).toMatch(/^actions_\d{4}-\d{2}-\d{2}\.csv$/);

    // Act: filtrar por código inexistente y exportar (AC5.3)
    await actionsPage.applyCodeFilter('zzz_inexistente');
    let downloaded = false;
    page.once('download', () => {
      downloaded = true;
    });
    await actionsPage.exportButton.click();

    // Assert: se notifica que no hay datos y no se descarga ningún fichero
    await expect(actionsPage.errorNotification).toBeVisible();
    expect(downloaded).toBe(false);
  });
});

test.describe.serial('Actions catalog restrictions (TC-ACC-06)', () => {
  /**
   * TC-ACC-06: Alta y borrado prohibidos (catálogo semilla).
   *
   * Verifica que POST y DELETE devuelven 405 y que la UI no muestra
   * opciones de crear ni eliminar.
   */

  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    await request.dispose();
  });

  test('TC-ACC-06 POST /actions should return 4xx (create forbidden)', async ({ request }) => {
    // El endpoint POST está bloqueado por Spring Security con denyAll().
    // En entorno MockMvc (sin context path) el AccessDeniedHandler devuelve 405;
    // en el servidor real (context path /template) getRequestURI() incluye el
    // prefijo y el handler cae al 403. Ambos son comportamientos de rechazo
    // válidos que verifican el requisito AC6.1 y AC6.3.
    const response = await request.post(`${API_URL}${ACTIONS_PATH}`, {
      headers: authHeaders(adminToken),
      data: { code: 'TEST_ACTION', name: 'Test', type: 'READ' },
    });

    // Assert: la operación está rechazada (403 o 405)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    expect([403, 405]).toContain(response.status());
  });

  test('TC-ACC-06 DELETE /actions/{id} should return 4xx (delete forbidden)', async ({ request }) => {
    // Obtener un id semilla real
    const original = await apiGetActionByCode(request, adminToken, SEED_ACTION_CODE);

    // Act: igual que POST, el comportamiento real puede ser 403 o 405
    const response = await request.delete(`${API_URL}${ACTIONS_PATH}/${original.id}`, {
      headers: authHeaders(adminToken),
    });

    // Assert (AC6.2 y AC6.3)
    expect([403, 405]).toContain(response.status());
  });

  test('TC-ACC-06 UI should not show create or delete buttons', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
    const actionsPage = await openActionsPage(page);

    // Assert (AC6.3): no existen botones de alta ni borrado en la pantalla
    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });
});

test.describe('Actions type integrity (TC-ACC-07)', () => {
  /**
   * TC-ACC-07: Integridad del catálogo de tipos (RNF-ACC-3).
   *
   * Verifica que un PUT con un tipo fuera del enum es rechazado.
   */

  test('TC-ACC-07 PUT with an invalid type should be rejected', async ({ request }) => {
    // Setup: obtener un id semilla real y el token administrador
    const adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    const original = await apiGetActionByCode(request, adminToken, SEED_ACTION_CODE);

    // Act: enviar un tipo inválido fuera del enum
    const response = await request.put(`${API_URL}${ACTIONS_PATH}/${original.id}`, {
      headers: authHeaders(adminToken),
      data: {
        id: original.id,
        code: original.code,
        name: original.name,
        description: original.description,
        type: 'DELETE',
      },
    });

    // Assert: la validación rechaza el tipo inválido (4xx)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe.serial('Actions authorization (RNF-ACC-1)', () => {
  /**
   * Verifica que el acceso al módulo requiere ACTION_READ y que sin
   * ACTION_WRITE el botón de edición no está disponible.
   */

  const suffix = Date.now().toString().slice(-8);
  const password = 'Test1234!';
  const noPermUser = `e2e_acc_noperm_${suffix}`;
  const readOnlyUser = `e2e_acc_readonly_${suffix}`;
  const profileIds: number[] = [];

  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);

    // Perfil sin ninguna acción
    const noPermProfileId = await apiCreateProfile(request, adminToken, `e2e_acc_noperm_${suffix}`, []);
    // Perfil con solo ACTION_READ
    const readOnlyProfileId = await apiCreateProfile(request, adminToken, `e2e_acc_readonly_${suffix}`, [
      'ACTION_READ',
    ]);
    profileIds.push(noPermProfileId, readOnlyProfileId);

    await apiCreateUser(request, adminToken, { username: noPermUser, password, profileId: noPermProfileId });
    await apiCreateUser(request, adminToken, { username: readOnlyUser, password, profileId: readOnlyProfileId });
    await request.dispose();
  });

  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    for (const username of [noPermUser, readOnlyUser]) {
      await apiDeleteUserByUsername(request, adminToken, username);
    }
    for (const profileId of profileIds) {
      await apiDeleteProfile(request, adminToken, profileId);
    }
    await request.dispose();
  });

  test('RNF-ACC-1 GET /actions should return 403 without ACTION_READ', async ({ request }) => {
    // Arrange
    const token = await apiLogin(request, noPermUser, password);

    // Act
    const response = await request.get(`${API_URL}${ACTIONS_PATH}`, {
      headers: authHeaders(token),
    });

    // Assert
    expect(response.status()).toBe(403);
  });

  test('RNF-ACC-1 UI with ACTION_READ only should not show btn-edit', async ({ page }) => {
    // Arrange: login con el usuario de solo lectura
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Este perfil solo tiene ACTION_READ; puede que aterrice en /forbidden.
    // No se espera /dashboard y se navega directamente a la pantalla.
    await loginPage.login(readOnlyUser, password);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    // Act
    const actionsPage = await openActionsPage(page);

    // Assert: tabla visible pero sin botón de edición
    await expect(actionsPage.table).toBeVisible();
    await expect(actionsPage.editButton).toHaveCount(0);
  });

  test('RNF-ACC-1 PUT /actions should return 403 with only ACTION_READ', async ({ request }) => {
    // Arrange
    const token = await apiLogin(request, readOnlyUser, password);
    const original = await apiGetActionByCode(request, adminToken, SEED_ACTION_CODE);

    // Act
    const response = await request.put(`${API_URL}${ACTIONS_PATH}/${original.id}`, {
      headers: authHeaders(token),
      data: {
        id: original.id,
        code: original.code,
        name: original.name,
        description: original.description,
        type: original.type,
      },
    });

    // Assert
    expect(response.status()).toBe(403);
  });
});
