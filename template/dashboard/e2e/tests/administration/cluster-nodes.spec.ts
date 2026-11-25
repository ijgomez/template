import { test, expect } from '../../fixtures/test';

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

  test('TC-CLN-01 should list nodes as a controlled screen', async ({ page }) => {
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

  test('TC-CLN-02 should filter nodes by hostname and clear the filter', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    const hostname = (await nodesPage.rows.first().locator('td').first().textContent())?.trim();
    expect(hostname).toBeTruthy();
    if (!hostname) {
      throw new Error('Expected the first node row to have a hostname');
    }

    await nodesPage.filterByHostname(hostname);
    await expect(nodesPage.rows).toHaveCount(1);
    await expect(nodesPage.rows.first()).toContainText(hostname);

    await nodesPage.clearFilters();
    await expect(nodesPage.rows.first()).toBeVisible();
  });

  test('TC-CLN-03 should open a node detail and return to the list', async ({ page }) => {
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

  test('TC-CLN-08, TC-CLN-09 should show the extended info sections in the node detail', async ({ page }) => {
    // Arrange
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();
    const detailResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && /\/cluster\/nodes\/\d+$/.test(new URL(response.url()).pathname),
    );

    // Act
    await nodesPage.openDetail(nodesPage.rows.first());
    const response = await detailResponse;

    // Assert: el detalle se obtiene con GET /nodes/{id} (7.8)
    expect(response.ok()).toBeTruthy();

    // Recursos (7.1, 7.2)
    await expect(page.getByTestId('node-form-resources')).toBeVisible();
    await expect(page.getByTestId('node-form-processors')).toBeVisible();
    await expect(page.getByTestId('node-form-fs-total')).toBeVisible();
    await expect(page.getByTestId('node-form-fs-free')).toBeVisible();
    await expect(page.getByTestId('node-form-fs-free-percent')).toBeVisible();
    await expect(page.getByTestId('node-form-processors')).not.toHaveValue('');

    // JVM y variables de entorno (7.1, 7.3): áreas de texto de solo lectura con líneas "clave = valor"
    for (const section of ['jvm', 'env']) {
      await expect(page.getByTestId(`node-form-${section}-section`)).toBeVisible();
      const text = page.getByTestId(`node-form-${section}-text`);
      await expect(text).toBeVisible();
      await expect(text).toHaveAttribute('readonly', '');
    }
  });
  test('TC-CLN-06 should export nodes to CSV', async ({ page }) => {
    const nodesPage = new ClusterNodesPage(page);
    await nodesPage.goto();

    const download = await nodesPage.exportCsv();

    expect(download.suggestedFilename()).toMatch(/^cluster-nodes_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
