import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de gestión de usuarios.
 *
 * Encapsula la interacción con `/administration/security/users`: listado,
 * barra de filtros, barra de acciones y formulario de alta/edición.
 * Usa los `data-testid` definidos en `user-list.component.html`,
 * `user-form.component.html` y el `tp-data-table` reutilizable.
 */
export class UsersPage {
  private readonly page: Page;

  // Listado
  readonly table: Locator;
  readonly rows: Locator;
  readonly paginationInfo: Locator;

  // Filtros
  readonly filterForm: Locator;
  readonly filterUsername: Locator;
  readonly filterFirstName: Locator;
  readonly filterProfile: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  // Barra de acciones
  readonly createButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly exportButton: Locator;

  // Formulario
  readonly form: Locator;
  readonly inputUsername: Locator;
  readonly inputPassword: Locator;
  readonly inputEmail: Locator;
  readonly inputFirstName: Locator;
  readonly inputLastName: Locator;
  readonly selectProfile: Locator;
  readonly selectedReports: Locator;
  readonly selectedReportsAddButton: Locator;
  readonly selectedReportsModal: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Modal de confirmación de borrado
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('users-table');
    this.rows = this.table.locator('tbody tr[role="row"]');
    this.paginationInfo = page.getByTestId('pagination-info');

    this.filterForm = page.getByTestId('users-filter-form');
    this.filterUsername = page.getByTestId('filter-username');
    this.filterFirstName = page.getByTestId('filter-firstName');
    this.filterProfile = page.getByTestId('filter-profile');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.createButton = page.getByTestId('btn-create');
    this.editButton = page.getByTestId('btn-edit');
    this.deleteButton = page.getByTestId('btn-delete');
    this.exportButton = page.getByTestId('btn-export');

    this.form = page.getByTestId('user-form');
    this.inputUsername = page.getByTestId('input-username');
    this.inputPassword = page.getByTestId('input-password');
    this.inputEmail = page.getByTestId('input-email');
    this.inputFirstName = page.getByTestId('input-first-name');
    this.inputLastName = page.getByTestId('input-last-name');
    this.selectProfile = page.getByTestId('select-profile');
    this.selectedReports = page.getByTestId('user-reports');
    this.selectedReportsAddButton = page.getByTestId('user-reports-btn-add');
    this.selectedReportsModal = page.getByTestId('user-reports-modal');
    this.saveButton = page.getByTestId('btn-save');
    this.cancelButton = page.getByTestId('btn-cancel');

    this.confirmDeleteButton = page.getByTestId('btn-confirm-delete');
  }

  /**
   * Devuelve la fila del listado cuyo texto contiene el `username` indicado.
   */
  rowByUsername(username: string): Locator {
    return this.rows.filter({ hasText: username });
  }

  /**
   * Selecciona en el listado la fila del usuario indicado (click sobre la fila).
   */
  async selectRowByUsername(username: string): Promise<void> {
    await this.rowByUsername(username).first().click();
  }

  /**
   * Navega directamente a la pantalla de usuarios y espera a que la tabla esté visible.
   * Requiere una sesión ya iniciada en el mismo contexto de página.
   */
  async goto(): Promise<void> {
    await this.page.goto('/administration/security/users');
    await this.page.waitForURL(/\/administration\/security\/users$/);
    await this.table.waitFor({ state: 'visible' });
    // La tabla se vuelve visible mientras aún muestra el estado de carga. Esperar
    // a la primera fila garantiza que la carga inicial terminó antes de leer.
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Aplica un filtro por nombre de usuario y ejecuta la búsqueda.
   *
   * Con búsqueda automática (debounce) basta rellenar el filtro, pero el botón
   * Buscar sigue disparando la consulta. Se espera la respuesta con page=0 para
   * que la tabla refleje el filtro antes de continuar. No se espera a que haya
   * filas: un filtro puede no devolver resultados (estado vacío legítimo).
   */
  async searchByUsername(username: string): Promise<void> {
    // Se espera la respuesta cuyo parámetro `username` coincide: la identifica
    // de forma inequívoca y evita confundirla con una petición previa en vuelo.
    const response = this.waitForUsersQuery({ username });
    await this.filterUsername.fill(username);
    await this.searchButton.click();
    await response;
  }

  /**
   * Limpia todos los filtros aplicados.
   */
  async clearFilters(): Promise<void> {
    // Tras limpiar no hay filtro `username`; se espera una respuesta sin ese
    // parámetro para no capturar la respuesta de un filtro anterior.
    const response = this.waitForUsersQuery({ noFilters: true });
    await this.clearButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Espera una respuesta GET del listado de usuarios. Requiere `/users` para no
   * confundirse con la carga del desplegable de perfiles (`/profiles`) que
   * alimenta el filtro. Los campos de `match` acotan la respuesta esperada por
   * sus parámetros de URL para no satisfacer la espera con otra petición en vuelo.
   */
  private waitForUsersQuery(match?: { username?: string; noFilters?: boolean }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      const url = response.url();
      if (
        response.request().method() !== 'GET' ||
        !url.includes('/administration/security/users') ||
        url.includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      const params = new URL(url).searchParams;
      if (match?.username !== undefined && params.get('username') !== match.username) {
        return false;
      }
      if (match?.noFilters && params.has('username')) {
        return false;
      }
      return true;
    });
  }

  /**
   * Abre el formulario de alta de usuario.
   */
  async openCreateForm(): Promise<void> {
    await this.createButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  /**
   * Rellena el formulario de alta con los datos indicados y guarda.
   * El perfil se selecciona por índice (el primero disponible por defecto).
   */
  async createUser(data: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileIndex?: number;
    reportIndexes?: number[];
  }): Promise<void> {
    await this.inputUsername.fill(data.username);
    await this.inputPassword.fill(data.password);
    if (data.email) {
      await this.inputEmail.fill(data.email);
    }
    if (data.firstName) {
      await this.inputFirstName.fill(data.firstName);
    }
    if (data.lastName) {
      await this.inputLastName.fill(data.lastName);
    }
    await this.selectProfile.selectOption({ index: data.profileIndex ?? 1 });

    if (data.reportIndexes && data.reportIndexes.length > 0) {
      await this.assignReports(data.reportIndexes);
    }

    // Guarda y espera a que el backend confirme la creación (201) antes de continuar.
    const createResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/administration/security/users') &&
        res.status() === 201,
    );
    await this.saveButton.click();
    await createResponse;
  }

  /**
   * Abre el modal de selección de informes y marca los índices proporcionados.
   */
  async assignReports(reportIndexes: number[]): Promise<void> {
    await this.selectedReportsAddButton.click();
    await this.selectedReportsModal.waitFor({ state: 'visible' });

    const rows = this.page.locator('[data-testid^="user-reports-modal-row-"]');
    const uniqueIndexes = [...new Set(reportIndexes)];

    for (const reportIndex of uniqueIndexes) {
      const row = rows.nth(reportIndex);
      await row.waitFor({ state: 'visible' });
      await row.click();
    }

    const acceptButton = this.page.getByTestId('user-reports-modal-accept');
    await acceptButton.click();
    await this.selectedReportsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Selecciona el usuario indicado y abre su formulario de edición.
   */
  async openEditForm(username: string): Promise<void> {
    await this.selectRowByUsername(username);
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  /**
   * Modifica campos editables del formulario y guarda, esperando la
   * confirmación del backend (PUT 200) antes de continuar.
   */
  async saveEdit(data: { firstName?: string; lastName?: string; email?: string }): Promise<void> {
    if (data.firstName !== undefined) {
      await this.inputFirstName.fill(data.firstName);
    }
    if (data.lastName !== undefined) {
      await this.inputLastName.fill(data.lastName);
    }
    if (data.email !== undefined) {
      await this.inputEmail.fill(data.email);
    }

    const updateResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/administration/security/users') &&
        res.status() === 200,
    );
    await this.saveButton.click();
    await updateResponse;
  }

  /**
   * Selecciona el usuario indicado, pulsa eliminar, confirma en el modal y
   * espera la confirmación del backend (DELETE 204) antes de continuar.
   */
  async deleteUser(username: string): Promise<void> {
    await this.selectRowByUsername(username);
    await this.deleteButton.click();
    await this.confirmDeleteButton.waitFor({ state: 'visible' });

    const deleteResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'DELETE' &&
        res.url().includes('/administration/security/users') &&
        res.status() === 204,
    );
    await this.confirmDeleteButton.click();
    await deleteResponse;
  }

  /**
   * Pulsa el botón de exportar y devuelve la descarga generada por el navegador.
   */
  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }
}
