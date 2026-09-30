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
    this.exportButton = page.getByTestId('audit-export-csv');
    this.backToListButton = page.getByTestId('audit-back-to-list');
  }

  /** Navega a la pantalla y espera al listado inicial. */
  async goto(): Promise<void> {
    await this.page.goto('/administration/audit');
    await this.page.waitForURL(/\/administration\/audit$/);
    await this.table.waitFor({ state: 'visible' });
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
    const response = this.waitForAuditQuery();
    await this.clearFiltersButton.click();
    await response;
  }

  /** Abre el detalle de la fila indicada. */
  async openDetail(row: Locator): Promise<void> {
    await row.click();
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
    const response = this.waitForAuditQuery();
    await this.applyFiltersButton.click();
    await response;
  }

  private waitForAuditQuery(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/administration/audit') &&
        !response.url().includes('/count') &&
        response.status() === 200,
    );
  }
}
