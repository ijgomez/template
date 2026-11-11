import { type Download, type Locator, type Page, type Response } from '@playwright/test';

/**
 * Page Object de la pantalla de auditoría.
 *
 * Encapsula la interacción con `/administration/audit`: consulta paginada,
 * filtros, detalle de solo lectura y exportación CSV.
 */
export class AuditPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;
  readonly filterForm: Locator;
  readonly filterUsername: Locator;
  readonly filterOperationType: Locator;
  readonly filterSection: Locator;
  readonly filterDateFrom: Locator;
  readonly filterDateTo: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly viewDetailButton: Locator;
  readonly exportButton: Locator;
  readonly backToListButton: Locator;
  readonly selectedRows: Locator;
  readonly dateRangeError: Locator;
  readonly pageSizeSelect: Locator;
  readonly nextPageButton: Locator;
  /** Los errores (p. ej. exportación sin datos) se muestran en el diálogo modal `error-dialog`. */
  readonly errorDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('audit-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.filterForm = page.getByTestId('audit-filter-form');
    this.filterUsername = page.getByTestId('audit-filter-username');
    this.filterOperationType = page.getByTestId('audit-filter-operation-type');
    this.filterSection = page.getByTestId('audit-filter-section');
    this.filterDateFrom = page.getByTestId('audit-filter-date-from');
    this.filterDateTo = page.getByTestId('audit-filter-date-to');
    this.applyFiltersButton = page.getByTestId('audit-apply-filters');
    this.clearFiltersButton = page.getByTestId('audit-clear-filters');
    this.viewDetailButton = page.getByTestId('audit-view-detail');
    this.exportButton = page.getByTestId('audit-export-csv');
    this.backToListButton = page.getByTestId('audit-back-to-list');
    this.selectedRows = this.table.locator('tbody tr[aria-selected="true"]');
    this.dateRangeError = this.filterForm.locator('.text-danger');
    this.pageSizeSelect = page.getByTestId('pagination-page-size');
    this.nextPageButton = page.getByTestId('pagination-next');
    this.errorDialog = page.getByTestId('error-dialog');
  }

  /** Cabecera de la columna indicada (`timestamp`, `username`, ...). */
  columnHeader(key: string): Locator {
    return this.page.getByTestId(`audit-table-th-${key}`);
  }

  /** Pulsa la cabecera y espera la consulta con el `sort` esperado (p. ej. `timestamp,asc`). */
  async sortBy(key: string, expected: string): Promise<Response> {
    const response = this.waitForAuditQuery({ sort: expected });
    await this.columnHeader(key).click();
    return response;
  }

  /** Cambia el tamaño de página y espera la consulta con el nuevo `size`. */
  async setPageSize(size: number): Promise<Response> {
    const response = this.waitForAuditQuery({ size });
    await this.pageSizeSelect.selectOption({ label: String(size) });
    return response;
  }

  /** Navega a la página siguiente y espera su consulta. */
  async goToNextPage(): Promise<Response> {
    const response = this.waitForAuditQuery({ page: 1 });
    await this.nextPageButton.click();
    return response;
  }

  /**
   * Informa el rango de días locales (`YYYY-MM-DD`) y aplica los filtros.
   * Devuelve la respuesta de la consulta, cuya URL contiene `fromDate`/`toDate` en UTC.
   */
  async applyDateRange(dateFrom: string, dateTo: string): Promise<Response> {
    await this.filterDateFrom.fill(dateFrom);
    await this.filterDateTo.fill(dateTo);
    const response = this.waitForAuditQuery({ page: 0, hasParam: 'toDate' });
    await this.applyFiltersButton.click();
    return response;
  }

  /** Navega a la pantalla y espera al listado inicial. */
  async goto(): Promise<void> {
    await this.page.goto('/administration/audit');
    await this.page.waitForURL(/\/administration\/audit$/);
    await this.table.waitFor({ state: 'visible' });
    // La tabla se vuelve visible mientras aún muestra el estado de carga (sin
    // filas). Esperar a la primera fila garantiza que la carga inicial terminó
    // antes de que un test lea celdas o cuente filas, evitando carreras cuando
    // la respuesta del backend llega con retraso bajo carga.
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /** Aplica los filtros indicados y espera la respuesta de la consulta. */
  async applyFilters(filters: {
    username?: string;
    operationType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE';
    section?: 'SECURITY' | 'REPORTS' | 'INTERFACES' | 'CLUSTER' | 'SYSTEM';
  }): Promise<void> {
    if (filters.username !== undefined) {
      await this.filterUsername.fill(filters.username);
    }
    if (filters.operationType !== undefined) {
      await this.filterOperationType.selectOption(filters.operationType);
    }
    if (filters.section !== undefined) {
      await this.filterSection.selectOption(filters.section);
    }

    await this.submitFilters();
  }

  /** Limpia los filtros y espera la recarga del listado. */
  async clearFilters(): Promise<void> {
    const response = this.waitForAuditQuery({ page: 0 });
    await this.clearFiltersButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /** Abre el detalle de la fila indicada seleccionándola y pulsando el botón Detalle. */
  async openDetail(row: Locator): Promise<void> {
    await row.click();
    await this.viewDetailButton.click();
    await this.backToListButton.waitFor({ state: 'visible' });
  }

  /** Abre el detalle de la fila indicada mediante doble clic. */
  async openDetailByDoubleClick(row: Locator): Promise<void> {
    await row.dblclick();
    await this.backToListButton.waitFor({ state: 'visible' });
  }

  /** Vuelve desde el detalle al listado. */
  async backToList(): Promise<void> {
    await this.backToListButton.click();
    await this.table.waitFor({ state: 'visible' });
  }

  /** Exporta el resultado filtrado y devuelve la descarga del navegador. */
  async exportCsv(): Promise<Download> {
    const download = this.page.waitForEvent('download');
    await this.exportButton.click();
    return download;
  }

  /**
   * Espera la consulta del listado (no el recuento) que cumpla los criterios indicados.
   */
  waitForAuditQuery(match?: { page?: number; size?: number; sort?: string; hasParam?: string }): Promise<Response> {
    return this.page.waitForResponse((response) => {
      if (
        response.request().method() !== 'GET' ||
        !response.url().includes('/administration/audit') ||
        response.url().includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      const params = new URL(response.url()).searchParams;
      if (match?.page !== undefined && params.get('page') !== String(match.page)) {
        return false;
      }
      if (match?.size !== undefined && params.get('size') !== String(match.size)) {
        return false;
      }
      if (match?.sort !== undefined && params.get('sort') !== match.sort) {
        return false;
      }
      if (match?.hasParam !== undefined && !params.has(match.hasParam)) {
        return false;
      }
      return true;
    });
  }

  private async submitFilters(): Promise<void> {
    // Aplicar filtros reinicia a la página 0; esperar una respuesta con page=0
    // evita confundirla con una petición previa aún en vuelo (p. ej. la carga
    // inicial que resuelve con retraso). No se espera a que haya filas porque
    // un filtro puede no devolver resultados (estado vacío legítimo).
    const response = this.waitForAuditQuery({ page: 0 });
    await this.applyFiltersButton.click();
    await response;
  }

}
