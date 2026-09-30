import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ClusterBlocksPage } from '../../pages/cluster-blocks.page';

/**
 * Tests E2E de la pantalla de bloqueos del cluster
 * (`/administration/cluster/blocks`).
 *
 * La suite es de solo lectura, al igual que la propia pantalla: no crea,
 * modifica ni elimina registros de `cluster_block`. La población de la tabla
 * depende de que el heartbeat del cluster (u otras tareas clusterizadas) haya
 * adquirido y liberado al menos un lock antes de ejecutar los tests (típicamente
 * el bloqueo `NODOS` usado por el HeartbeatWorker).
 *
 * Requiere el backend de integración levantado con PostgreSQL (los advisory
 * locks no operan en H2), y que el usuario administrador posea la acción
 * `CLUSTER_LOCK_READ`.
 */
test.describe('Cluster blocks', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list cluster blocks as a read-only screen', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    await expect(blocksPage.table).toBeVisible();
    await expect(blocksPage.filterForm).toBeVisible();
    await expect(blocksPage.rows.first()).toBeVisible();
    expect(await blocksPage.rows.count()).toBeGreaterThan(0);

    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-edit')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter blocks by name and clear the filter', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    const firstRow = blocksPage.rows.first();
    const name = (await firstRow.locator('td').first().textContent())?.trim();
    expect(name).toBeTruthy();

    await blocksPage.filterByName(name!);
    await expect(blocksPage.rows.first()).toBeVisible();
    for (const row of await blocksPage.rows.all()) {
      await expect(row.locator('td').first()).toContainText(name!);
    }

    await blocksPage.clearFilters();
    await expect(blocksPage.rows.first()).toBeVisible();
  });

  test('should open a block detail and return to the list', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    const selectedRow = blocksPage.rows.first();
    const cells = await selectedRow.locator('td').allTextContents();
    await blocksPage.openDetail(selectedRow);

    await expect(blocksPage.backToListButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/bloqueo/i);

    const detail = page.locator('.card .card-body');
    const expectedValues = cells.map((c) => c.trim()).filter((v) => v.length > 0);
    for (const value of expectedValues.slice(0, 6)) {
      await expect(detail).toContainText(value);
    }

    await blocksPage.backToList();
    await expect(blocksPage.filterForm).toBeVisible();
  });

  test('should export the filtered blocks to CSV', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    const download = await blocksPage.exportCsv();

    expect(download.suggestedFilename()).toMatch(/^cluster_blocks_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
