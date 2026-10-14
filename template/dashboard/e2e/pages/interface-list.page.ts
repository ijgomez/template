import { type Locator, type Page } from '@playwright/test';

export type InterfaceOperationType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type InterfaceLogStatus = 'SUCCESS' | 'ERROR' | 'BAD_REQUEST' | 'NOT_FOUND';

/**
 * Page Object de la pantalla de listado de interfaces.
 *
 * Encapsula la interacción con `/interfaces/monitor` usando los `data-testid`
 * definidos en `interface-list.component.html` y la tabla reutilizable `tp-data-table`.
 */
export class InterfaceListPage {
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
  readonly interfaceListNavItem: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByTestId("interface-list-title");
    this.filterDateFrom = page.getByTestId("interface-list-filter-date-from");
    this.filterDateTo = page.getByTestId("interface-list-filter-date-to");
    this.filterOperationType = page.getByTestId("interface-list-filter-operation-type");
    this.filterInterface = page.getByTestId("interface-list-filter-interface");
    this.filterStatus = page.getByTestId("interface-list-filter-status");
    this.applyFiltersButton = page.getByTestId("interface-list-apply-filters");
    this.clearFiltersButton = page.getByTestId("interface-list-clear-filters");

    this.viewDetailButton = page.getByTestId("interface-list-view-detail");
    this.exportButton = page.getByTestId("interface-list-export-csv");

    this.table = page.getByTestId("interface-list-table");
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.paginationInfo = page.getByTestId('pagination-info');
    this.pageSizeSelect = page.getByTestId('pagination-page-size');

    this.backToListButton = page.getByTestId("interface-list-back-to-list");
    this.detailCard = page.locator('.card .card-body');

    this.interfacesNavToggle = page.getByTestId('nav-toggle-menu.interfaces');
    this.interfaceListNavItem = page.getByTestId("nav-menu.interfaces.interfaceList");
  }

  /**
   * Navega a la pantalla de listado de interfaces y espera a que la tabla sea visible.
   */
  async goto(): Promise<void> {
    await this.page.goto('/interfaces/monitor');
    await this.page.waitForURL(/\/interfaces\/monitor$/);
    await this.table.waitFor({ state: 'visible' });
    // La tabla se vuelve visible mientras aún muestra el estado de carga (sin
    // filas de datos). Esperar a la primera fila garantiza que la carga inicial
    // ha terminado antes de que un test lea celdas o cuente filas, evitando
    // carreras cuando la respuesta del backend llega con retraso bajo carga.
    await this.rows.first().waitFor({ state: 'visible' });
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

    // Al aplicar filtros se reinicia a la página 0; esperar una respuesta con
    // page=0 evita confundirla con una petición previa aún en vuelo. No se
    // espera a que haya filas visibles porque un filtro puede no devolver
    // resultados (estado vacío legítimo).
    const response = this.waitForInterfaceListQuery({ page: 0 });
    await this.applyFiltersButton.click();
    await response;
  }

  /**
   * Limpia los filtros y espera la recarga completa del listado.
   */
  async clearFilters(): Promise<void> {
    const response = this.waitForInterfaceListQuery({ page: 0 });
    await this.clearFiltersButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
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
   *
   * Espera específicamente la respuesta cuyo parámetro `size` coincide con el
   * solicitado. Así se evita confundir una petición previa aún en vuelo (p. ej.
   * la carga inicial con `size=10` que resuelve con retraso) con la respuesta
   * del cambio de tamaño, lo que provocaría leer la tabla antes de tiempo.
   */
  async changePageSize(size: number): Promise<void> {
    const response = this.waitForInterfaceListQuery({ size });
    await this.pageSizeSelect.selectOption(size.toString());
    await response;
    // La respuesta de red llega antes de que Angular repinte la tabla. Esperar
    // a que la primera fila sea visible garantiza que el estado de carga ha
    // terminado antes de que el test cuente filas.
    await this.rows.first().waitFor({ state: 'visible' });
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

  /**
   * Espera una respuesta GET del listado de interfaces (`/interfaces/monitor`,
   * excluyendo `/count`). Si se indica `size` y/o `page`, solo resuelve cuando
   * los parámetros de la URL coinciden, de modo que una petición distinta aún
   * en vuelo no satisfaga la espera de forma prematura.
   */
  private waitForInterfaceListQuery(match?: { size?: number; page?: number }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      if (
        response.request().method() !== 'GET' ||
        !response.url().includes('/interfaces/monitor') ||
        response.url().includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }

      const params = new URL(response.url()).searchParams;
      if (match?.size !== undefined && params.get('size') !== String(match.size)) {
        return false;
      }
      if (match?.page !== undefined && params.get('page') !== String(match.page)) {
        return false;
      }
      return true;
    });
  }
}
