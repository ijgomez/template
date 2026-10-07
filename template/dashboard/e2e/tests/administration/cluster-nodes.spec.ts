import { test, expect } from '@playwright/test';

import { testUsers } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';
import { ClusterNodesPage } from '../../pages/cluster-nodes.page';

/**
 * Tests E2E de la pantalla de nodos del cluster
 * (`/administration/cluster/nodes`).
 *
 * La suite es deliberadamente no destructiva: no cambia el maestro del
 * cluster, porque esa operación modifica estado compartido y requiere más de
 * un nodo activo para probarse de forma aislada.
 */
test.describe('Cluster nodes', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(testUsers.valid.username, testUsers.valid.password);
  });

  test('should list nodes as a controlled screen', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    await expect(nodesPage.table).toBeVisible();
    await expect(nodesPage.filterForm).toBeVisible();
    await expect(nodesPage.rows.first()).toBeVisible();
    expect(await nodesPage.rows.count()).toBeGreaterThan(0);
    await expect(nodesPage.setMasterButton).toBeVisible();
    await expect(nodesPage.setMasterButton).toBeDisabled();

    await expect(page.getByTestId('btn-create')).toHaveCount(0);
    await expect(page.getByTestId('btn-delete')).toHaveCount(0);
  });

  test('should filter nodes by hostname and clear the filter', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    const hostname = (await nodesPage.rows.first().locator('td').first().textContent())?.trim();
    expect(hostname).toBeTruthy();

    await nodesPage.filterByHostname(hostname!);
    await expect(nodesPage.rows).toHaveCount(1);
    await expect(nodesPage.rows.first()).toContainText(hostname!);

    await nodesPage.clearFilters();
    await expect(nodesPage.rows.first()).toBeVisible();
  });

  test('should open a node detail and return to the list', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    const firstRow = nodesPage.rows.first();
    const hostname = (await firstRow.locator('td').first().textContent())?.trim();
    await nodesPage.openDetail(firstRow);

    await expect(nodesPage.backButton).toBeVisible();
    await expect(page.locator('h1')).toContainText(/node/i);
    if (hostname) {
      await expect(nodesPage.nodeCard.getByRole('textbox', { name: /hostname/i })).toHaveValue(hostname);
    }

    await nodesPage.backToList();
    await expect(nodesPage.filterForm).toBeVisible();
  });

  test('should export nodes to CSV', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    const download = await nodesPage.exportCsv();

    expect(download.suggestedFilename()).toMatch(/^cluster-nodes_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
