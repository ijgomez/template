import { test, expect } from '@playwright/test';

import { LoginPage } from '../../pages/login.page';

test.describe('Login', () => {
  test('should render the login form', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();

    // Assert
    await expect(loginPage.title).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should require username and password', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.submitButton.click();

    // Assert: seguimos en la pantalla de login (el formulario no navega)
    await expect(page).toHaveURL(/\/login$/);
  });

  test('should toggle password visibility', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('secret');

    // Assert: por defecto el campo está oculto
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Act
    await loginPage.togglePasswordButton.click();

    // Assert: ahora el campo muestra el texto
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });
});
