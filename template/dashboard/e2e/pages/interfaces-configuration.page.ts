import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de configuración de interfaces.
 *
 * Encapsula la interacción con `/interfaces/configuration` usando los `data-testid`
 * definidos en `configuration.component.html` y la tabla reutilizable `tp-data-table`.
 */
export class InterfacesConfigurationPage {
  private readonly page: Page;

  readonly title: Locator;
  readonly filterForm: Locator;
  readonly filterName: Locator;
  readonly filterProtocol: Locator;
  readonly filterStatus: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  readonly viewDetailButton: Locator;
  readonly exportButton: Locator;

  readonly table: Locator;
  readonly rows: Locator;
  readonly paginationInfo: Locator;
  readonly pageSizeSelect: Locator;

  readonly backToListButton: Locator;
  readonly detailCard: Locator;

  readonly interfacesNavToggle: Locator;
  readonly configurationNavItem: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.locator('h1');
    this.filterForm = page.getByTestId('config-filter-form');
    this.filterName = page.getByTestId('filter-name');
    this.filterProtocol = page.getByTestId('filter-protocol');
    this.filterStatus = page.getByTestId('filter-status');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.viewDetailButton = page.getByTestId('btn-view-detail');
    this.exportButton = page.getByTestId('btn-export');

    this.table = page.getByTestId('configuration-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.paginationInfo = page.getByTestId('pagination-info');
    this.pageSizeSelect = page.getByTestId('pagination-page-size');

    this.backToListButton = page.getByTestId('configuration-back-to-list');
    this.detailCard = page.locator('.card .card-body');

    this.interfacesNavToggle = page.getByTestId('nav-toggle-menu.interfaces');
    this.configurationNavItem = page.getByTestId('nav-menu.interfaces.configuration');
  }

  /**
   * Navega a la pantalla de configuración de interfaces y espera a que la tabla sea visible.
   */
  async goto(): Promise<void> {
    await this.page.goto('/interfaces/configuration');
    await this.page.waitForURL(/\/interfaces\/configuration$/);
    await this.table.waitFor({ state: 'visible' });
  }

  /**
   * Aplica los filtros especificados en el formulario.
   */
  async applyFilters(filters: {
    name?: string;
    protocol?: 'REST' | 'SOAP' | 'LDAP' | 'SMTP';
    status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  }): Promise<void> {
    if (filters.name !== undefined) {
      await this.filterName.fill(filters.name);
    }
    if (filters.protocol !== undefined) {
      await this.filterProtocol.selectOption(filters.protocol);
    }
    if (filters.status !== undefined) {
      await this.filterStatus.selectOption(filters.status);
    }
    await this.searchButton.click();
  }

  /**
   * Limpia todos los filtros del formulario.
   */
  async clearFilters(): Promise<void> {
    await this.clearButton.click();
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
   * Cambia el tamaño de página del listado.
   */
  async changePageSize(size: number): Promise<void> {
    await this.pageSizeSelect.selectOption(size.toString());
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
}
