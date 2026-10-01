import { type Locator, type Page } from '@playwright/test';

export type InterfaceOperationType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type InterfaceLogStatus = 'SUCCESS' | 'ERROR' | 'BAD_REQUEST' | 'NOT_FOUND';

/**
 * Page Object de la pantalla de monitor de interfaces.
 *
 * Encapsula la interacción con `/interfaces/monitor` usando los `data-testid`
 * definidos en `monitor.component.html` y la tabla reutilizable `tp-data-table`.
 */
export class InterfacesMonitorPage {
  private readonly page: Page;

  readonly title: Locator;
  readonly filterDateFrom: Locator;
  readonly filterDateTo: Locator;
  readonly filterOperationType: Locator;
  readonly filterInterface: Locator;
  readonly filterStatus: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;

  readonly viewDetailButton: Locator;
  readonly exportButton: Locator;

  readonly table: Locator;
  readonly rows: Locator;
  readonly paginationInfo: Locator;
  readonly pageSizeSelect: Locator;

  readonly backToListButton: Locator;
  readonly detailCard: Locator;

  readonly interfacesNavToggle: Locator;
  readonly monitorNavItem: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByTestId('monitor-title');
    this.filterDateFrom = page.getByTestId('monitor-filter-date-from');
    this.filterDateTo = page.getByTestId('monitor-filter-date-to');
    this.filterOperationType = page.getByTestId('monitor-filter-operation-type');
    this.filterInterface = page.getByTestId('monitor-filter-interface');
    this.filterStatus = page.getByTestId('monitor-filter-status');
    this.applyFiltersButton = page.getByTestId('monitor-apply-filters');
    this.clearFiltersButton = page.getByTestId('monitor-clear-filters');

    this.viewDetailButton = page.getByTestId('monitor-view-detail');
    this.exportButton = page.getByTestId('monitor-export-csv');

    this.table = page.getByTestId('monitor-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.paginationInfo = page.getByTestId('pagination-info');
    this.pageSizeSelect = page.getByTestId('pagination-page-size');

    this.backToListButton = page.getByTestId('monitor-back-to-list');
    this.detailCard = page.locator('.card .card-body');

    this.interfacesNavToggle = page.getByTestId('nav-toggle-menu.interfaces');
    this.monitorNavItem = page.getByTestId('nav-menu.interfaces.monitor');
  }

  /**
   * Navega a la pantalla del monitor de interfaces y espera a que la tabla sea visible.
   */
  async goto(): Promise<void> {
    await this.page.goto('/interfaces/monitor');
    await this.page.waitForURL(/\/interfaces\/monitor$/);
    await this.table.waitFor({ state: 'visible' });
  }

  /**
   * Aplica los filtros especificados y espera la respuesta del backend.
   */
  async applyFilters(filters: {
    dateFrom?: string;
    dateTo?: string;
    operationType?: InterfaceOperationType;
    interfaceId?: string;
    status?: InterfaceLogStatus;
  }): Promise<void> {
    if (filters.dateFrom !== undefined) {
      await this.filterDateFrom.fill(filters.dateFrom);
    }
    if (filters.dateTo !== undefined) {
      await this.filterDateTo.fill(filters.dateTo);
    }
    if (filters.operationType !== undefined) {
      await this.filterOperationType.selectOption(filters.operationType);
    }
    if (filters.interfaceId !== undefined) {
      await this.filterInterface.selectOption(filters.interfaceId);
    }
    if (filters.status !== undefined) {
      await this.filterStatus.selectOption(filters.status);
    }

    const response = this.waitForMonitorQuery();
    await this.applyFiltersButton.click();
    await response;
  }

  /**
   * Limpia los filtros y espera la recarga completa del listado.
   */
  async clearFilters(): Promise<void> {
    const response = this.waitForMonitorQuery();
    await this.clearFiltersButton.click();
    await response;
  }

  /**
   * Selecciona una fila por su índice.
   */
  async selectRowByIndex(index = 0): Promise<void> {
    await this.rows.nth(index).click();
  }

  /**
   * Abre la vista de detalle de la fila seleccionada (mediante botón de la barra de herramientas).
   */
  async openDetail(row?: Locator): Promise<void> {
    if (row) {
      await row.click();
    }
    await this.viewDetailButton.click();
    await this.backToListButton.waitFor({ state: 'visible' });
  }

  /**
   * Abre el detalle mediante doble clic en la fila indicada por índice.
   */
  async openDetailByDoubleClick(index = 0): Promise<void> {
    await this.rows.nth(index).dblclick();
    await this.backToListButton.waitFor({ state: 'visible' });
  }

  /**
   * Vuelve desde la vista de detalle al listado principal.
   */
  async backToList(): Promise<void> {
    await this.backToListButton.click();
    await this.table.waitFor({ state: 'visible' });
  }

  /**
   * Cambia el tamaño de página y espera la respuesta del backend.
   */
  async changePageSize(size: number): Promise<void> {
    const response = this.waitForMonitorQuery();
    await this.pageSizeSelect.selectOption(size.toString());
    await response;
  }

  /**
   * Exporta a CSV y espera el evento de descarga del navegador.
   */
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }

  /**
   * Despliega la sección de Interfaces en el menú lateral si está colapsada.
   */
  async expandInterfacesSidebar(): Promise<void> {
    const isExpanded = await this.interfacesNavToggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.interfacesNavToggle.click();
    }
  }

  private waitForMonitorQuery(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/interfaces/monitor') &&
        !response.url().includes('/count') &&
        response.status() === 200,
    );
  }
}
