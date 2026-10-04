import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de nodos del cluster.
 *
 * Encapsula la consulta, filtrado, detalle y exportación de
 * `/administration/cluster/nodes`.
 */
export class ClusterNodesPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;
  readonly filterForm: Locator;
  readonly filterHostname: Locator;
  readonly filterStatus: Locator;
  readonly filterMaster: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly setMasterButton: Locator;
  readonly exportButton: Locator;
  readonly backButton: Locator;
  readonly nodeCard: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('cluster-nodes-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.filterForm = page.getByTestId('nodes-filter-form');
    this.filterHostname = page.getByTestId('filter-hostname');
    this.filterStatus = page.getByTestId('filter-status');
    this.filterMaster = page.getByTestId('filter-master');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');
    this.setMasterButton = page.getByTestId('btn-set-master');
    this.exportButton = page.getByTestId('btn-export');
    this.backButton = page.getByTestId('node-detail-btn-back');
    this.nodeCard = page.getByTestId('node-form-card');
  }

  /** Navega al listado de nodos y espera a que esté visible. */
  async goto(): Promise<void> {
    await this.page.goto('/administration/cluster/nodes');
    await this.page.waitForURL(/\/administration\/cluster\/nodes$/);
    await this.table.waitFor({ state: 'visible' });
  }

  /** Filtra por hostname y aplica la búsqueda local. */
  async filterByHostname(hostname: string): Promise<void> {
    await this.filterHostname.fill(hostname);
    await this.searchButton.click();
  }

  /** Restablece todos los filtros. */
  async clearFilters(): Promise<void> {
    await this.clearButton.click();
  }

  /** Abre mediante doble clic el detalle de la fila indicada. */
  async openDetail(row: Locator): Promise<void> {
    await row.dblclick();
    await this.backButton.waitFor({ state: 'visible' });
  }

  /** Vuelve del detalle al listado. */
  async backToList(): Promise<void> {
    await this.backButton.click();
    await this.table.waitFor({ state: 'visible' });
  }

  /** Exporta los nodos filtrados y devuelve la descarga generada. */
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const download = this.page.waitForEvent('download');
    await this.exportButton.click();
    return download;
  }
}
