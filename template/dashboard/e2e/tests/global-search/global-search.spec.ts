import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { GlobalSearchPage } from '../../pages/global-search.page';
import { LoginPage } from '../../pages/login.page';

test.describe('Global search', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange: login como admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should show grouped results and navigate to the detail of a result', async ({ page }) => {
    const globalSearch = new GlobalSearchPage(page);

    // Act: término de >= 2 caracteres (coincide con el usuario admin)
    await globalSearch.search(testUsers.valid.username);

    // Assert: popup con resultados agrupados por tipo
    await expect(globalSearch.popup).toBeVisible();
    await expect(globalSearch.groups.first()).toBeVisible();
    await expect(globalSearch.results.first()).toBeVisible();

    // Act: abrir el primer resultado
    await globalSearch.openFirstResult();

    // Assert: se navega al detalle (deep-link por query params) y se cierra el popup
    await expect(page).toHaveURL(/[?&]view=detail/);
    await expect(globalSearch.popup).toBeHidden();
  });
});
