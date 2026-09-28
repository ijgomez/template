import { test, expect } from '@playwright/test';

import { buildNewUser, testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { UsersPage } from '../../pages/users.page';

/**
 * Tests E2E de la pantalla de gestión de usuarios
 * (`/administration/security/users`).
 *
 * Cada test inicia sesión con un usuario administrador (que posee las acciones
 * USER_READ y USER_WRITE) y navega directamente a la pantalla de usuarios.
 *
 * Requiere el backend de integración levantado (perfil `test`).
 */
test.describe.serial('Users management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list users', async ({ page }) => {
    // Arrange & Act
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // Assert: la tabla es visible y hay al menos una fila
    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.rows.first()).toBeVisible();
    expect(await usersPage.rows.count()).toBeGreaterThan(0);
    // La barra de filtros y las acciones de administración están disponibles
    await expect(usersPage.filterForm).toBeVisible();
    await expect(usersPage.createButton).toBeVisible();
  });

  test('should search users by username', async ({ page }) => {
    // Arrange
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // Act: filtrar por el usuario administrador conocido
    await usersPage.searchByUsername(testUsers.valid.username);

    // Assert: al menos una fila coincide y contiene el término buscado
    await expect(usersPage.rows.first()).toBeVisible();
    await expect(usersPage.rows.first()).toContainText(testUsers.valid.username);

    // Act: un filtro sin coincidencias deja el listado vacío
    await usersPage.searchByUsername('no-existe-usuario-e2e-xyz');

    // Assert: no se muestran filas de datos
    await expect(usersPage.rows).toHaveCount(0);
  });

  test('should create a new user', async ({ page }) => {
    // Arrange
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const newUser = buildNewUser();

    // Act: abrir el formulario de alta y crear el usuario
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

  test('should edit an existing user', async ({ page }) => {
    // Arrange: crear un usuario propio para editarlo de forma aislada
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const newUser = buildNewUser();
    await usersPage.openCreateForm();
    await usersPage.createUser({
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    // Act: localizar el usuario, abrir su edición y cambiar datos
    await usersPage.searchByUsername(newUser.username);
    await usersPage.openEditForm(newUser.username);
    // El campo usuario es inmutable en edición (readonly)
    await expect(usersPage.inputUsername).toHaveJSProperty('readOnly', true);
    await usersPage.saveEdit({ firstName: 'Editado', lastName: 'E2E' });

    // Assert: se vuelve al listado y el cambio se refleja al consultar el usuario
    await expect(usersPage.filterForm).toBeVisible();
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rowByUsername(newUser.username).first()).toContainText('Editado');
  });

  test('should delete a user', async ({ page }) => {
    // Arrange: crear un usuario propio para eliminarlo
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const newUser = buildNewUser();
    await usersPage.openCreateForm();
    await usersPage.createUser({
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    // Act: localizar el usuario y eliminarlo con confirmación
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rowByUsername(newUser.username).first()).toBeVisible();
    await usersPage.deleteUser(newUser.username);

    // Assert: el usuario ya no aparece al buscarlo
    await usersPage.searchByUsername(newUser.username);
    await expect(usersPage.rows).toHaveCount(0);
  });

  test('should export users to CSV', async ({ page }) => {
    // Arrange
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // Act: pulsar exportar y capturar la descarga
    const download = await usersPage.exportCsv();

    // Assert: se genera un fichero CSV
    expect(download.suggestedFilename()).toBe('users.csv');
  });
});
