import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de gestión de acciones.
 *
 * Encapsula la interacción con `/administration/security/actions` usando los
 * `data-testid` definidos en la vista de listado y formulario.
 */
export class ActionsPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;

  readonly filterForm: Locator;
  readonly filterCode: Locator;
  readonly filterType: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  readonly editButton: Locator;
  readonly exportButton: Locator;

  readonly form: Locator;
  readonly inputCode: Locator;
  readonly inputName: Locator;
  readonly inputDescription: Locator;
  readonly selectType: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('actions-table');
    this.rows = this.table.locator('tbody tr[role="row"]');

    this.filterForm = page.getByTestId('actions-filter-form');
    this.filterCode = page.getByTestId('filter-code');
    this.filterType = page.getByTestId('filter-type');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.editButton = page.getByTestId('btn-edit');
    this.exportButton = page.getByTestId('btn-export');

    this.form = page.getByTestId('action-form');
    this.inputCode = page.getByTestId('input-code');
    this.inputName = page.getByTestId('input-name');
    this.inputDescription = page.getByTestId('input-description');
    this.selectType = page.getByTestId('select-type');
    this.saveButton = page.getByTestId('btn-save');
    this.cancelButton = page.getByTestId('btn-cancel');
  }

  rowByCode(code: string): Locator {
    return this.rows.filter({ hasText: code });
  }

  async selectRowByCode(code: string): Promise<void> {
    await this.rowByCode(code).first().click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/security/actions');
    await this.page.waitForURL(/\/administration\/security\/actions$/);
    await this.table.waitFor({ state: 'visible' });
  }

  async applyCodeFilter(code: string): Promise<void> {
    await this.filterCode.fill(code);
    await this.searchButton.click();
  }

  async applyTypeFilter(type: 'READ' | 'WRITE' | 'EXECUTE'): Promise<void> {
    await this.filterType.selectOption(type);
    await this.searchButton.click();
  }

  async clearFilters(): Promise<void> {
    await this.clearButton.click();
  }

  async openEditFormByIndex(index = 0): Promise<void> {
    await this.rows.nth(index).click();
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async saveEdit(data: { name?: string; description?: string; type?: 'READ' | 'WRITE' | 'EXECUTE' }): Promise<void> {
    if (data.name !== undefined) {
      await this.inputName.fill(data.name);
    }
    if (data.description !== undefined) {
      await this.inputDescription.fill(data.description);
    }
    if (data.type !== undefined) {
      await this.selectType.selectOption(data.type);
    }

    const updateResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/administration/security/actions') &&
        res.status() === 200,
    );

    await this.saveButton.click();
    await updateResponse;
  }

  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }
}
