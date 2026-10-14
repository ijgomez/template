import { type Locator, type Page } from '@playwright/test';

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
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const download = this.page.waitForEvent('download');
    await this.exportButton.click();
    return download;
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

  private waitForAuditQuery(match?: { page?: number }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      if (
        response.request().method() !== 'GET' ||
        !response.url().includes('/administration/audit') ||
        response.url().includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      if (match?.page !== undefined && new URL(response.url()).searchParams.get('page') !== String(match.page)) {
        return false;
      }
      return true;
    });
  }
}
