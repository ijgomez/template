import { test, expect, type APIRequestContext, type Request } from '@playwright/test';

import {
  API_URL,
  USERS_PATH,
  apiCreateProfile,
  apiCreateUser,
  apiDeleteProfile,
  apiDeleteUserByUsername,
  apiLogin,
  apiLoginAttempt,
  authHeaders,
  firstProfileId,
} from '../../fixtures/api-client';
import { buildNewUser, testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { UsersPage } from '../../pages/users.page';

/**
 * Tests E2E de la pantalla de gestión de usuarios
 * (`/administration/security/users`).
 *
 * Cubren el catálogo TC-USR-01..13 de
 * `template-docs/02-functional/administration/security/users.md` (sección 4.6).
 * Cada título lleva el identificador del caso para facilitar la trazabilidad.
 *
 * Los tests de UI inician sesión con un usuario administrador (acciones
 * USER_READ y USER_WRITE) y navegan directamente a la pantalla de usuarios.
 * Los casos que crean usuarios los eliminan por API en el teardown.
 *
 * Requiere el backend de integración levantado (perfil `test`).
 */

/** Crea un `UsersPage` ya posicionado en el listado. */
async function openUsersPage(page: import('@playwright/test').Page): Promise<UsersPage> {
  const usersPage = new UsersPage(page);
  await usersPage.goto();
  return usersPage;
}

test.describe.serial('Users management', () => {
  /** Usernames creados por el test en curso, para eliminarlos en el teardown. */
  let createdUsernames: string[] = [];

  test.beforeEach(async ({ page }) => {
    createdUsernames = [];
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test.afterEach(async ({ request }) => {
    if (createdUsernames.length === 0) {
      return;
    }
    const token = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    for (const username of createdUsernames) {
      await apiDeleteUserByUsername(request, token, username);
    }
  });

  /** Crea por API un usuario aislado para el caso en curso y lo registra para el teardown. */
  async function seedUser(request: APIRequestContext): Promise<ReturnType<typeof buildNewUser>> {
    const newUser = buildNewUser();
    const token = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    const profileId = await firstProfileId(request, token);
    createdUsernames.push(newUser.username);
    await apiCreateUser(request, token, { ...newUser, profileId });
    return newUser;
  }

  test('TC-USR-01 should list users with sorting and pagination', async ({ page }) => {
    // Arrange & Act
    const usersPage = await openUsersPage(page);

    // Assert: tabla con las columnas esperadas
    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.rows.first()).toBeVisible();
    expect(await usersPage.rows.count()).toBeGreaterThan(0);
    await expect(usersPage.filterForm).toBeVisible();
    await expect(usersPage.createButton).toBeVisible();
    for (const key of ['username', 'firstName', 'lastName', 'email', 'profileName', 'lastAccess']) {
      await expect(usersPage.columnHeader(key)).toBeVisible();
    }

    // Act & Assert: ordenación ascendente y después descendente
    await usersPage.sortBy('username', 'username,asc');
    await expect(usersPage.columnHeader('username')).toHaveAttribute('aria-sort', 'ascending');
    await usersPage.sortBy('username', 'username,desc');
    await expect(usersPage.columnHeader('username')).toHaveAttribute('aria-sort', 'descending');

    // Act & Assert: cambio de tamaño de página
    await usersPage.setPageSize(5);
    expect(await usersPage.rows.count()).toBeLessThanOrEqual(5);

    // Act & Assert: si hay más de una página, se puede navegar a la siguiente
    if (await usersPage.nextPageButton.isEnabled()) {
      const nextPage = page.waitForResponse(
        (res) =>
          res.request().method() === 'GET' &&
          res.url().includes('/administration/security/users') &&
          !res.url().includes('/count') &&
          new URL(res.url()).searchParams.get('page') === '1',
      );
      await usersPage.nextPageButton.click();
      await nextPage;
      await expect(usersPage.rows.first()).toBeVisible();
    }
  });

  test('TC-USR-02 should search users by username and clear filters', async ({ page }) => {
    // Arrange
    const usersPage = await openUsersPage(page);

    // Act: filtrar por el usuario administrador conocido
    await usersPage.searchByUsername(testUsers.valid.username);

    // Assert: al menos una fila coincide y contiene el término buscado
    await expect(usersPage.rows.first()).toBeVisible();
    await expect(usersPage.rows.first()).toContainText(testUsers.valid.username);

    // Act: un filtro sin coincidencias deja el listado vacío
    await usersPage.searchByUsername('zzz_inexistente');

    // Assert: no se muestran filas de datos
    await expect(usersPage.rows).toHaveCount(0);

    // Act: limpiar filtros
    await usersPage.clearFilters();

    // Assert: filtros restablecidos y listado completo recargado
    await expect(usersPage.filterUsername).toHaveValue('');
    expect(await usersPage.rows.count()).toBeGreaterThan(0);
  });

  test('TC-USR-03 should create a new user', async ({ page }) => {
    // Arrange
    const usersPage = await openUsersPage(page);
    const newUser = buildNewUser();
    createdUsernames.push(newUser.username);

    // Act: abrir el formulario de alta y crear el usuario (el page object espera el 201)
    await usersPage.openCreateForm();
    await expect(usersPage.form).toBeVisible();
    await usersPage.createUser({
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    // Assert: se vuelve al listado (la barra de filtros reaparece)
    await expect(usersPage.filterForm).toBeVisible();

    // Assert: el usuario recién creado aparece al buscarlo
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rows.first()).toBeVisible();
    await expect(usersPage.rows.first()).toContainText(newUser.username);
  });

  test('TC-USR-04 should reject a user with an invalid email format', async ({ page }) => {
    // Arrange
    const usersPage = await openUsersPage(page);
    const newUser = buildNewUser();
    const postRequests: Request[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/administration/security/users')) {
        postRequests.push(req);
      }
    });

    // Act: rellenar el formulario con un email sin arroba
    await usersPage.openCreateForm();
    await usersPage.inputUsername.fill(newUser.username);
    await usersPage.inputPassword.fill(newUser.password);
    await usersPage.selectProfile.selectOption({ index: 1 });
    await usersPage.inputEmail.fill('correo-sin-arroba');

    // Assert: el campo email marca error de formato y el guardado no se completa
    await expect(usersPage.errorEmail).toBeVisible();
    await expect(usersPage.saveButton).toBeDisabled();
    expect(postRequests).toHaveLength(0);

    // Teardown: cancelar el formulario (no se crea nada)
    await usersPage.cancelButton.click();
    await expect(usersPage.filterForm).toBeVisible();
  });

  test('TC-USR-05 should edit an existing user keeping username immutable', async ({
    page,
    request,
  }) => {
    // Arrange: crear un usuario propio para editarlo de forma aislada
    const newUser = await seedUser(request);
    const usersPage = await openUsersPage(page);

    // Act: localizar el usuario y abrir su edición
    await usersPage.searchByUsername(newUser.username);
    await usersPage.openEditForm(newUser.username);

    // Assert: usuario de solo lectura y contraseña no obligatoria
    await expect(usersPage.inputUsername).toHaveJSProperty('readOnly', true);
    await expect(usersPage.saveButton).toBeEnabled();

    // Act: cambiar apellidos y guardar (el page object espera el 200)
    await usersPage.saveEdit({ lastName: 'Test-Editado' });

    // Assert: se vuelve al listado y el cambio se refleja en la fila
    await expect(usersPage.filterForm).toBeVisible();
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rowByUsername(newUser.username).first()).toContainText('Test-Editado');
  });

  test('TC-USR-06 should delete a user only after confirmation', async ({ page, request }) => {
    // Arrange: crear un usuario propio para eliminarlo
    const newUser = await seedUser(request);
    const usersPage = await openUsersPage(page);
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rowByUsername(newUser.username).first()).toBeVisible();

    // Act: abrir el modal de confirmación
    await usersPage.openDeleteModal(newUser.username);

    // Assert: el modal muestra el nombre del usuario
    await expect(usersPage.deleteConfirmBody).toContainText(newUser.username);

    // Act: cancelar
    await usersPage.cancelDeleteButton.click();

    // Assert: el modal se cierra y el usuario sigue en el listado
    await expect(usersPage.confirmDeleteButton).toBeHidden();
    await expect(usersPage.rowByUsername(newUser.username).first()).toBeVisible();

    // Act: repetir y confirmar (el page object espera el 204)
    await usersPage.deleteUser(newUser.username);

    // Assert: el usuario desaparece al buscarlo
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rows).toHaveCount(0);
  });

  test('TC-USR-07 should open the read-only detail on double click', async ({ page }) => {
    // Arrange
    const usersPage = await openUsersPage(page);
    await usersPage.searchByUsername(testUsers.valid.username);
    await expect(usersPage.rowByUsername(testUsers.valid.username).first()).toBeVisible();

    // Act: doble clic sobre la fila del administrador
    await usersPage.openDetailByDoubleClick(testUsers.valid.username);

    // Assert: modo solo lectura con auditoría y contraseña enmascarada
    await expect(usersPage.inputUsername).toHaveValue(testUsers.valid.username);
    await expect(usersPage.inputUsername).toBeDisabled();
    await expect(usersPage.inputLastAccess).toBeVisible();
    await expect(usersPage.inputCreatedAt).toBeVisible();
    await expect(usersPage.inputLastModifiedAt).toBeVisible();
    await expect(usersPage.inputPassword).not.toHaveValue(testUsers.valid.password);
    await expect(usersPage.saveButton).toHaveCount(0);
  });

  test('TC-USR-09 should export the filtered users to CSV', async ({ page }) => {
    // Arrange
    const usersPage = await openUsersPage(page);

    // Act: exportar sin filtros y capturar la descarga
    const download = await usersPage.exportCsv();

    // Assert: se genera un fichero CSV con marca temporal
    expect(download.suggestedFilename()).toMatch(/^users_\d{4}-\d{2}-\d{2}\.csv$/);

    // Act: filtrar por un usuario inexistente y exportar
    await usersPage.searchByUsername('zzz_inexistente');
    let downloaded = false;
    page.once('download', () => {
      downloaded = true;
    });
    await usersPage.exportButton.click();

    // Assert: se notifica que no hay datos y no se genera fichero
    await expect(usersPage.errorNotification).toBeVisible();
    expect(downloaded).toBe(false);
  });

  test('TC-USR-11 should assign one or more reports to a user', async ({ page }) => {
    const usersPage = await openUsersPage(page);

    const newUser = buildNewUser();
    createdUsernames.push(newUser.username);
    await usersPage.openCreateForm();
    await usersPage.createUser({
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      reportIndexes: [0, 1],
    });

    await usersPage.searchByUsername(newUser.username);
    await usersPage.openEditForm(newUser.username);

    const reportItems = page.locator('[data-testid^="user-reports-item-"]');
    await expect(reportItems).toHaveCount(2);
    await expect(reportItems.first()).toBeVisible();
    await expect(reportItems.nth(1)).toBeVisible();
  });

  test('TC-USR-12 should lock and unlock a user account', async ({ page, request }) => {
    // Arrange: crear un usuario propio para operar sobre un registro aislado
    const newUser = await seedUser(request);
    const usersPage = await openUsersPage(page);

    // 1. El badge de estado muestra la cuenta como desbloqueada
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.lockedBadgeIn(newUser.username)).toHaveClass(/bg-success-subtle/);

    // 2. Marcar el check de bloqueo administrativo y guardar (el page object espera el 200)
    await usersPage.openEditForm(newUser.username);
    await expect(usersPage.lockCheckbox).not.toBeChecked();
    await usersPage.saveEdit({ locked: true });
    await expect(usersPage.filterForm).toBeVisible();

    // 3. El badge muestra la cuenta como bloqueada
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.lockedBadgeIn(newUser.username)).toHaveClass(/bg-danger/);

    // 4. El filtro *Bloqueadas* incluye la fila
    await usersPage.filterByLockState('locked');
    await expect(usersPage.rowByUsername(newUser.username).first()).toBeVisible();

    // 5. El filtro *Desbloqueadas* no incluye la fila
    await usersPage.filterByLockState('unlocked');
    await expect(usersPage.rowByUsername(newUser.username)).toHaveCount(0);

    // 6. Desmarcar el check y guardar para desbloquear la cuenta
    await usersPage.filterByLockState('all');
    await usersPage.searchByUsername(newUser.username);
    await usersPage.openEditForm(newUser.username);
    await expect(usersPage.lockCheckbox).toBeChecked();
    await usersPage.saveEdit({ locked: false });
    await expect(usersPage.filterForm).toBeVisible();

    // 7. El badge vuelve a desbloqueada y el check queda deshabilitado en el detalle
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.lockedBadgeIn(newUser.username)).toHaveClass(/bg-success-subtle/);
    await usersPage.openDetailByDoubleClick(newUser.username);
    await expect(usersPage.lockCheckbox).toBeDisabled();
    await expect(usersPage.lockCheckbox).not.toBeChecked();
  });

  test('TC-USR-13 should lock an account temporarily after failed login attempts', async ({
    page,
    request,
  }) => {
    // Arrange: usuario propio con credenciales conocidas y umbral de bloqueo
    const newUser = await seedUser(request);
    const maxAttempts = Number(process.env['E2E_LOGIN_MAX_ATTEMPTS'] ?? 5);

    // 1. N intentos de login fallidos responden 401
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const failed = await apiLoginAttempt(request, newUser.username, 'WrongPassword!');
      expect(failed.status(), `intento fallido ${attempt}`).toBe(401);
    }

    // 2. Con la contraseña correcta la cuenta está bloqueada: 429 + Retry-After
    const locked = await apiLoginAttempt(request, newUser.username, newUser.password);
    expect(locked.status()).toBe(429);
    expect(locked.headers()['retry-after']).toBeTruthy();

    // 3. La UI de administración muestra la cuenta como bloqueada
    const usersPage = await openUsersPage(page);
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.lockedBadgeIn(newUser.username)).toHaveClass(/bg-danger/);

    // 4. El filtro *Bloqueadas* incluye la fila
    await usersPage.filterByLockState('locked');
    await expect(usersPage.rowByUsername(newUser.username).first()).toBeVisible();
  });
});

test.describe('Users self-service API', () => {
  test('TC-USR-08 should read and update the own profile via /me', async ({ request }) => {
    // Setup: autenticar y guardar los valores originales
    const token = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);
    const headers = authHeaders(token);
    const meUrl = `${API_URL}${USERS_PATH}/me`;

    const getResponse = await request.get(meUrl, { headers });
    expect(getResponse.status()).toBe(200);
    const original = (await getResponse.json()) as Record<string, unknown>;
    expect(original['username']).toBe(testUsers.valid.username);
    expect(original).not.toHaveProperty('password', expect.stringMatching(/.+/));

    try {
      // Act: actualizar nombre, apellidos y email propios
      const putResponse = await request.put(meUrl, {
        headers,
        data: {
          ...original,
          firstName: 'Admin',
          lastName: 'Autoservicio',
          email: 'admin@example.com',
        },
      });

      // Assert: 200 con los datos actualizados
      expect(putResponse.status()).toBe(200);
      const updated = (await putResponse.json()) as Record<string, unknown>;
      expect(updated['firstName']).toBe('Admin');
      expect(updated['lastName']).toBe('Autoservicio');
      expect(updated['email']).toBe('admin@example.com');
    } finally {
      // Teardown: restaurar los valores originales
      await request.put(meUrl, { headers, data: original });
    }
  });
});

test.describe.serial('Users authorization', () => {
  const suffix = Date.now().toString().slice(-8);
  const password = 'Test1234!';
  const noPermUser = `e2e_noperm_${suffix}`;
  const readOnlyUser = `e2e_readonly_${suffix}`;
  const profileIds: number[] = [];

  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    // Setup: perfiles y usuarios de prueba creados con el administrador
    const request = await playwright.request.newContext();
    adminToken = await apiLogin(request, testUsers.valid.username, testUsers.valid.password);

    const noPermProfile = await apiCreateProfile(request, adminToken, `e2e_noperm_${suffix}`, []);
    const readOnlyProfile = await apiCreateProfile(request, adminToken, `e2e_readonly_${suffix}`, [
      'USER_READ',
    ]);
    profileIds.push(noPermProfile, readOnlyProfile);

    await apiCreateUser(request, adminToken, { username: noPermUser, password, profileId: noPermProfile });
    await apiCreateUser(request, adminToken, {
      username: readOnlyUser,
      password,
      profileId: readOnlyProfile,
    });
    await request.dispose();
  });

  test.afterAll(async ({ playwright }) => {
    // Teardown: eliminar usuarios y perfiles de prueba
    const request = await playwright.request.newContext();
    for (const username of [noPermUser, readOnlyUser]) {
      await apiDeleteUserByUsername(request, adminToken, username);
    }
    for (const profileId of profileIds) {
      await apiDeleteProfile(request, adminToken, profileId);
    }
    await request.dispose();
  });

  test('TC-USR-10 should forbid the listing without USER_READ nor USER_WRITE', async ({ request }) => {
    // Arrange
    const token = await apiLogin(request, noPermUser, password);

    // Act
    const response = await request.get(`${API_URL}${USERS_PATH}`, { headers: authHeaders(token) });

    // Assert
    expect(response.status()).toBe(403);
  });

  test('TC-USR-10 should hide write actions for a USER_READ-only user', async ({ page }) => {
    // Arrange: login con el usuario de solo lectura
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Este perfil solo tiene USER_READ: tras el login puede aterrizar en
    // /forbidden (el dashboard exige otras acciones), por lo que no se espera
    // /dashboard y se navega directamente a la pantalla de usuarios.
    await loginPage.login(readOnlyUser, password);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    // Act
    const usersPage = await openUsersPage(page);

    // Assert: el listado es visible pero no hay acciones de escritura
    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.createButton).toHaveCount(0);
    await expect(usersPage.editButton).toHaveCount(0);
    await expect(usersPage.deleteButton).toHaveCount(0);
  });

  test('TC-USR-10 should forbid creating users without USER_WRITE', async ({ request }) => {
    // Arrange
    const token = await apiLogin(request, readOnlyUser, password);

    // Act
    const response = await request.post(`${API_URL}${USERS_PATH}`, {
      headers: authHeaders(token),
      data: { id: null, username: `e2e_forbidden_${suffix}`, password, reportIds: [] },
    });

    // Assert
    expect(response.status()).toBe(403);
  });
});
