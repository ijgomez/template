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

  test('should show all block metrics in the list without a detail screen', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    // Cada fila expone las seis columnas (nombre, fecha de inicio y las cuatro métricas)
    // directamente en el listado, sin necesidad de abrir un detalle.
    const firstRow = blocksPage.rows.first();
    await expect(firstRow).toBeVisible();
    expect(await firstRow.locator('td').count()).toBeGreaterThanOrEqual(6);

    // Al seleccionar una fila no se navega a ninguna pantalla de detalle:
    // el filtro sigue visible y no aparece el botón "Volver" del antiguo detalle.
    await firstRow.click();
    await expect(blocksPage.filterForm).toBeVisible();
    await expect(page.getByTestId('cluster-blocks-back-to-list')).toHaveCount(0);
  });

  test('should export the filtered blocks to CSV', async ({ page }) => {
    const blocksPage = new ClusterBlocksPage(page);
    await blocksPage.goto();

    const download = await blocksPage.exportCsv();

    expect(download.suggestedFilename()).toMatch(/^cluster_blocks_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
