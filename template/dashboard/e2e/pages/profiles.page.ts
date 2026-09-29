import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de gestión de perfiles.
 *
 * Encapsula la interacción con `/administration/security/profiles` usando los
 * `data-testid` definidos en los componentes de listado y formulario.
 */
export class ProfilesPage {
  private readonly page: Page;

  readonly table: Locator;
  readonly rows: Locator;

  readonly filterForm: Locator;
  readonly filterName: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  readonly createButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly exportButton: Locator;

  readonly form: Locator;
  readonly inputName: Locator;
  readonly inputDescription: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('profiles-table');
    this.rows = this.table.locator('tbody tr[role="row"]');

    this.filterForm = page.getByTestId('profiles-filter-form');
    this.filterName = page.getByTestId('filter-name');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.createButton = page.getByTestId('btn-create');
    this.editButton = page.getByTestId('btn-edit');
    this.deleteButton = page.getByTestId('btn-delete');
    this.exportButton = page.getByTestId('btn-export');

    this.form = page.getByTestId('profile-form');
    this.inputName = page.getByTestId('input-name');
    this.inputDescription = page.getByTestId('input-description');
    this.saveButton = page.getByTestId('btn-save');
    this.cancelButton = page.getByTestId('btn-cancel');
    this.confirmDeleteButton = page.getByTestId('btn-confirm-delete');
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async selectRowByName(name: string): Promise<void> {
    await this.rowByName(name).first().click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/security/profiles');
    await this.page.waitForURL(/\/administration\/security\/profiles$/);
    await this.table.waitFor({ state: 'visible' });
  }

  async searchByName(name: string): Promise<void> {
    await this.filterName.fill(name);
    await this.searchButton.click();
  }

  async clearFilters(): Promise<void> {
    await this.clearButton.click();
  }

  async openCreateForm(): Promise<void> {
    await this.createButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async createProfile(data: { name: string; description?: string }): Promise<void> {
    await this.inputName.fill(data.name);
    if (data.description) {
      await this.inputDescription.fill(data.description);
    }

    const createResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/administration/security/profiles') &&
        res.status() === 201,
    );

    await this.saveButton.click();
    await createResponse;
  }

  async openEditForm(name: string): Promise<void> {
    await this.selectRowByName(name);
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async saveEdit(data: { name?: string; description?: string }): Promise<void> {
    if (data.name !== undefined) {
      await this.inputName.fill(data.name);
    }
    if (data.description !== undefined) {
      await this.inputDescription.fill(data.description);
    }

    const updateResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/administration/security/profiles') &&
        res.status() === 200,
    );

    await this.saveButton.click();
    await updateResponse;
  }

  async deleteProfile(name: string): Promise<void> {
    await this.selectRowByName(name);
    await this.deleteButton.click();
    await this.confirmDeleteButton.waitFor({ state: 'visible' });

    const deleteResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'DELETE' &&
        res.url().includes('/administration/security/profiles') &&
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
