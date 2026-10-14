import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de gestión de parámetros.
 *
 * Encapsula la interacción con `/administration/parameters` usando los
 * `data-testid` definidos en la vista de listado y formulario.
 */
export class ParametersPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;

  readonly filterForm: Locator;
  readonly filterCode: Locator;
  readonly filterType: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  readonly createButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly exportButton: Locator;

  readonly form: Locator;
  readonly inputCode: Locator;
  readonly inputValue: Locator;
  readonly inputDescription: Locator;
  readonly selectType: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('parameters-table');
    this.rows = this.table.locator('tbody tr[role="row"]');

    this.filterForm = page.getByTestId('parameters-filter-form');
    this.filterCode = page.getByTestId('filter-code');
    this.filterType = page.getByTestId('filter-type');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.createButton = page.getByTestId('btn-create');
    this.editButton = page.getByTestId('btn-edit');
    this.deleteButton = page.getByTestId('btn-delete');
    this.exportButton = page.getByTestId('btn-export');

    this.form = page.getByTestId('parameter-form');
    this.inputCode = page.getByTestId('input-code');
    this.inputValue = page.getByTestId('input-value');
    this.inputDescription = page.getByTestId('input-description');
    this.selectType = page.getByTestId('select-type');
    this.saveButton = page.getByTestId('parameter-form-btn-save');
    this.cancelButton = page.getByTestId('parameter-form-btn-cancel');
    this.confirmDeleteButton = page.getByTestId('btn-confirm-delete');
  }

  rowByCode(code: string): Locator {
    return this.rows.filter({ hasText: code });
  }

  async selectRowByCode(code: string): Promise<void> {
    await this.rowByCode(code).first().click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/parameters');
    await this.page.waitForURL(/\/administration\/parameters$/);
    await this.table.waitFor({ state: 'visible' });
    // La tabla se vuelve visible mientras aún muestra el estado de carga. Esperar
    // a la primera fila garantiza que la carga inicial terminó antes de leer.
    await this.rows.first().waitFor({ state: 'visible' });
  }

  async searchByCode(code: string): Promise<void> {
    // Con búsqueda automática (debounce) basta rellenar el filtro, pero el botón
    // Buscar sigue disparando la consulta. Se espera la respuesta cuyo parámetro
    // `code` coincide para que la tabla refleje el filtro antes de continuar.
    const response = this.waitForParametersQuery({ code });
    await this.filterCode.fill(code);
    await this.searchButton.click();
    await response;
  }

  async applyTypeFilter(type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE'): Promise<void> {
    const response = this.waitForParametersQuery({ type });
    await this.filterType.selectOption(type);
    await this.searchButton.click();
    await response;
  }

  async clearFilters(): Promise<void> {
    // Tras limpiar no hay filtros; se espera una respuesta sin `code` ni `type`
    // para no capturar la respuesta de un filtro anterior.
    const response = this.waitForParametersQuery({ noFilters: true });
    await this.clearButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Espera una respuesta GET del listado de parámetros. Los campos de `match`
   * acotan la respuesta esperada por sus parámetros de URL para no satisfacer
   * la espera con una petición distinta aún en vuelo.
   */
  private waitForParametersQuery(match?: { code?: string; type?: string; noFilters?: boolean }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      const url = response.url();
      if (
        response.request().method() !== 'GET' ||
        !url.includes('/administration/parameters') ||
        url.includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      const params = new URL(url).searchParams;
      if (match?.code !== undefined && params.get('code') !== match.code) {
        return false;
      }
      if (match?.type !== undefined && params.get('type') !== match.type) {
        return false;
      }
      if (match?.noFilters && (params.has('code') || params.has('type'))) {
        return false;
      }
      return true;
    });
  }

  async openCreateForm(): Promise<void> {
    await this.createButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async createParameter(data: {
    code: string;
    value: string;
    description?: string;
    type?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE';
  }): Promise<void> {
    await this.inputCode.fill(data.code);
    if (data.type) {
      await this.selectType.selectOption(data.type);
    }
    await this.inputValue.fill(data.value);
    if (data.description) {
      await this.inputDescription.fill(data.description);
    }

    const createResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/administration/parameters') &&
        res.status() === 201,
    );

    await this.saveButton.click();
    await createResponse;
  }

  async openEditForm(code: string): Promise<void> {
    await this.selectRowByCode(code);
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async saveEdit(data: {
    value?: string;
    description?: string;
    type?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE';
  }): Promise<void> {
    if (data.type !== undefined) {
      await this.selectType.selectOption(data.type);
    }
    if (data.value !== undefined) {
      await this.inputValue.fill(data.value);
    }
    if (data.description !== undefined) {
      await this.inputDescription.fill(data.description);
    }

    const updateResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/administration/parameters') &&
        res.status() === 200,
    );

    await this.saveButton.click();
    await updateResponse;
  }

  async deleteParameter(code: string): Promise<void> {
    await this.selectRowByCode(code);
    await this.deleteButton.click();
    await this.confirmDeleteButton.waitFor({ state: 'visible' });

    const deleteResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'DELETE' &&
        res.url().includes('/administration/parameters') &&
        res.status() === 204,
    );

    await this.confirmDeleteButton.click();
    await deleteResponse;
  }

  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }
}
