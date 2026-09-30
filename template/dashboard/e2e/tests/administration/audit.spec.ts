import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { AuditPage } from '../../pages/audit.page';

/**
 * Tests E2E de la pantalla de auditoría (`/administration/audit`).
 *
 * El inicio de sesión de cada caso deja una entrada `EXECUTE` de la sección
 * `SECURITY` para el usuario administrador. La suite solo consulta y exporta:
 * no crea, modifica ni elimina registros de auditoría.
 *
 * Requiere el backend de integración levantado (perfil `test`) y que el
 * usuario administrador posea la acción `SYSTEM_LOG_READ`.
 */
test.describe('Audit log', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list audit logs as a read-only screen', async ({ page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();

    await expect(auditPage.table).toBeVisible();
    await expect(auditPage.filterForm).toBeVisible();
    await expect(auditPage.rows.first()).toBeVisible();
    expect(await auditPage.rows.count()).toBeGreaterThan(0);

    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter audit logs by username, operation and section', async ({ page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();

    await auditPage.applyFilters({ username: testUsers.valid.username });
    await expect(auditPage.rows.first()).toBeVisible();
    await expect(auditPage.rows.first()).toContainText(testUsers.valid.username);

    await auditPage.applyFilters({ operationType: 'EXECUTE', section: 'SECURITY' });
    await expect(auditPage.rows.first()).toBeVisible();
    await expect(auditPage.rows.first()).toContainText('EXECUTE');
    await expect(auditPage.rows.first()).toContainText('SECURITY');

    await auditPage.clearFilters();
    await expect(auditPage.rows.first()).toBeVisible();
  });

  test('should open an audit log detail and return to the list', async ({ page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();

    const selectedRow = auditPage.rows.first();
    const cells = await selectedRow.locator('td').allTextContents();
    await auditPage.openDetail(selectedRow);

    await expect(auditPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/audit/i);
    const detail = page.locator('.card .card-body');
    for (const value of [cells[1], cells[2], cells[3], cells[4], cells[6]]) {
      if (value?.trim()) {
        await expect(detail).toContainText(value.trim());
      }
    }

    await auditPage.backToList();
    await expect(auditPage.filterForm).toBeVisible();
  });

  test('should export the filtered audit logs to CSV', async ({ page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();
    await auditPage.applyFilters({ username: testUsers.valid.username });

    const download = await auditPage.exportCsv();

    expect(download.suggestedFilename()).toMatch(/^audit_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
