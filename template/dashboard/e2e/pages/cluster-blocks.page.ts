import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de bloqueos del cluster.
 *
 * Encapsula la consulta paginada en servidor, el filtrado por nombre y la
 * exportación CSV de `/administration/cluster/blocks`. El listado muestra todas
 * las métricas de cada bloqueo, por lo que no existe pantalla de detalle.
 */
export class ClusterBlocksPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;
  readonly filterForm: Locator;
  readonly filterName: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('cluster-blocks-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.filterForm = page.getByTestId('blocks-filter-form');
    this.filterName = page.getByTestId('cluster-blocks-filter-name');
    this.applyFiltersButton = page.getByTestId('cluster-blocks-apply-filters');
    this.clearFiltersButton = page.getByTestId('cluster-blocks-clear-filters');
    this.exportButton = page.getByTestId('cluster-blocks-export-csv');
  }

  /** Navega a la pantalla y espera al listado inicial. */
  async goto(): Promise<void> {
    await this.page.goto('/administration/cluster/blocks');
    await this.page.waitForURL(/\/administration\/cluster\/blocks$/);
    await this.table.waitFor({ state: 'visible' });
  }

  /** Filtra por nombre de tarea y espera la respuesta paginada del backend. */
  async filterByName(name: string): Promise<void> {
    await this.filterName.fill(name);
    await this.applyFilters();
  }

  /** Aplica los filtros rellenados y espera la recarga de la tabla. */
  async applyFilters(): Promise<void> {
    const response = this.waitForBlocksQuery();
    await this.applyFiltersButton.click();
    await response;
  }

  /** Limpia los filtros y espera la recarga del listado. */
  async clearFilters(): Promise<void> {
    const response = this.waitForBlocksQuery();
    await this.clearFiltersButton.click();
    await response;
  }

  /** Exporta el resultado filtrado y devuelve la descarga del navegador. */
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const download = this.page.waitForEvent('download');
    await this.exportButton.click();
    return download;
  }

  private waitForBlocksQuery(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/administration/cluster/blocks') &&
        !response.url().includes('/count') &&
        response.status() === 200,
    );
  }
}
