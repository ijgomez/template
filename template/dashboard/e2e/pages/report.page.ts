import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de ejecución de informes.
 *
 * Encapsula la interacción con `/reports/:id` usando los `data-testid`
 * definidos en `report-list.component.html` y la navegación del sidebar.
 */
export class ReportPage {
  private readonly page: Page;

  readonly title: Locator;
  readonly description: Locator;

  readonly filterForm: Locator;
  readonly executeButton: Locator;
  readonly clearButton: Locator;

  readonly exportPdfButton: Locator;
  readonly exportXlsxButton: Locator;
  readonly exportCsvButton: Locator;
  readonly exportTxtButton: Locator;

  readonly table: Locator;
  readonly headers: Locator;
  readonly rows: Locator;
  readonly pageSizeSelect: Locator;
  readonly pagination: Locator;

  readonly reportsNavToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.locator('h1');
    this.description = page.locator('.tp-content p.text-muted');

    this.filterForm = page.getByTestId('report-filter-form');
    this.executeButton = page.getByTestId('report-execute-btn');
    this.clearButton = page.getByTestId('report-clear-btn');

    this.exportPdfButton = page.getByTestId('report-export-pdf');
    this.exportXlsxButton = page.getByTestId('report-export-xlsx');
    this.exportCsvButton = page.getByTestId('report-export-csv');
    this.exportTxtButton = page.getByTestId('report-export-txt');

    this.table = page.getByTestId('report-results-table');
    this.headers = this.table.locator('thead th');
    this.rows = this.table.locator('tbody tr');
    this.pageSizeSelect = page.getByTestId('report-page-size');
    this.pagination = page.locator('.card-footer .pagination');

    this.reportsNavToggle = page.getByTestId('nav-toggle-menu.reports');
  }

  /**
   * Obtiene el localizador del input del filtro según su nombre.
   */
  filterInput(name: string): Locator {
    return this.page.getByTestId(`report-filter-${name}`);
  }

  /**
   * Obtiene el localizador de un elemento de informe en el menú lateral.
   */
  reportNavItem(reportName: string): Locator {
    return this.page.getByTestId(`nav-${reportName}`);
  }

  /**
   * Navega directamente a la pantalla del informe indicado por su ID.
   */
  async goto(reportId = 1): Promise<void> {
    await this.page.goto(`/reports/${reportId}`);
    await this.page.waitForURL(new RegExp(`/reports/${reportId}$`));
    await this.filterForm.waitFor({ state: 'visible' });
  }

  /**
   * Rellena un filtro de texto, número o fecha.
   */
  async fillFilter(name: string, value: string): Promise<void> {
    await this.filterInput(name).fill(value);
  }

  /**
   * Selecciona una opción en un filtro de tipo SELECT.
   */
  async selectFilter(name: string, value: string): Promise<void> {
    await this.filterInput(name).selectOption(value);
  }

  /**
   * Ejecuta el informe pulsando el botón de ejecución y esperando la respuesta.
   */
  async execute(): Promise<void> {
    const executeResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/execute') &&
        res.status() === 200,
    );

    await this.executeButton.click();
    await executeResponse;
    await this.table.waitFor({ state: 'visible' });
  }

  /**
   * Limpia los filtros y restablece los resultados.
   */
  async clearFilters(): Promise<void> {
    await this.clearButton.click();
  }

  /**
   * Cambia el tamaño de página de los resultados y espera la recarga.
   */
  async changePageSize(size: number): Promise<void> {
    const pageResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/execute') &&
        res.url().includes(`size=${size}`) &&
        res.status() === 200,
    );

    await this.pageSizeSelect.selectOption(size.toString());
    await pageResponse;
  }

  /**
   * Exporta el informe a formato CSV y espera la descarga.
   */
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportCsvButton.click();
    return downloadPromise;
  }

  /**
   * Exporta el informe a formato TXT y espera la descarga.
   */
  async exportTxt(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportTxtButton.click();
    return downloadPromise;
  }

  /**
   * Dispara la exportación a formato PDF.
   */
  async exportPdf(): Promise<void> {
    await this.exportPdfButton.click();
  }

  /**
   * Dispara la exportación a formato XLSX.
   */
  async exportXlsx(): Promise<void> {
    await this.exportXlsxButton.click();
  }

  /**
   * Abre la sección de informes en el sidebar si no está expandida.
   */
  async expandReportsSidebar(): Promise<void> {
    const isExpanded = await this.reportsNavToggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.reportsNavToggle.click();
    }
  }
}
