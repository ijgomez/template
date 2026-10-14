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
    // La tabla se vuelve visible mientras aún muestra el estado de carga. Esperar
    // a la primera fila garantiza que la carga inicial terminó antes de leer.
    await this.rows.first().waitFor({ state: 'visible' });
  }

  async searchByName(name: string): Promise<void> {
    // Con búsqueda automática (debounce) basta rellenar el filtro, pero el botón
    // Buscar sigue disparando la consulta. Se espera la respuesta cuyo parámetro
    // `name` coincide: la identifica de forma inequívoca y evita confundirla con
    // una petición previa en vuelo. No se espera a que haya filas: la búsqueda
    // puede no devolver resultados (estado vacío legítimo).
    const response = this.waitForProfilesQuery({ name });
    await this.filterName.fill(name);
    await this.searchButton.click();
    await response;
  }

  async clearFilters(): Promise<void> {
    // Tras limpiar no hay filtro `name`; se espera una respuesta sin ese
    // parámetro para no capturar la respuesta de un filtro anterior.
    const response = this.waitForProfilesQuery({ noFilters: true });
    await this.clearButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Espera una respuesta GET del listado de perfiles. Excluye el endpoint de
   * acciones (`/actions`, consumido por el formulario). Los campos de `match`
   * acotan la respuesta esperada por sus parámetros de URL para no satisfacer
   * la espera con una petición distinta aún en vuelo.
   */
  private waitForProfilesQuery(match?: { name?: string; noFilters?: boolean }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      const url = response.url();
      if (
        response.request().method() !== 'GET' ||
        !url.includes('/administration/security/profiles') ||
        url.includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      const params = new URL(url).searchParams;
      if (match?.name !== undefined && params.get('name') !== match.name) {
        return false;
      }
      if (match?.noFilters && params.has('name')) {
        return false;
      }
      return true;
    });
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
