import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la pantalla de gestión de acciones.
 *
 * Encapsula la interacción con `/administration/security/actions` usando los
 * `data-testid` definidos en la vista de listado y formulario.
 */
export class ActionsPage {
  private readonly page: Page;

  // ── Tabla ──────────────────────────────────────────────────────────────────
  readonly table: Locator;
  readonly rows: Locator;

  // ── Cabeceras de columna (para verificar ordenación) ──────────────────────
  columnHeader(key: string): Locator {
    return this.page.getByTestId(`actions-table-th-${key}`);
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  readonly filterForm: Locator;
  readonly filterCode: Locator;
  readonly filterType: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;

  // ── Barra de acciones ──────────────────────────────────────────────────────
  readonly detailButton: Locator;
  readonly editButton: Locator;
  readonly exportButton: Locator;

  // ── Formulario (edición / detalle) ─────────────────────────────────────────
  readonly form: Locator;
  readonly inputCode: Locator;
  readonly inputName: Locator;
  readonly inputDescription: Locator;
  readonly selectType: Locator;
  readonly inputTypeReadonly: Locator;
  readonly inputCreatedAt: Locator;
  readonly inputLastModifiedAt: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  /**
   * Botón "Editar" del modo detalle (`action-form-btn-edit`).
   * Distinto del `btn-edit` de la barra del listado.
   */
  readonly detailEditButton: Locator;
  /** Botón "Volver" del modo detalle (`action-form-btn-back`). */
  readonly backButton: Locator;

  /** Los errores no se muestran como toast sino como diálogo modal (`error-dialog`). */
  readonly errorNotification: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('actions-table');
    this.rows = this.table.locator('tbody tr[role="row"]');

    this.filterForm = page.getByTestId('actions-filter-form');
    this.filterCode = page.getByTestId('filter-code');
    this.filterType = page.getByTestId('filter-type');
    this.searchButton = page.getByTestId('btn-filter-search');
    this.clearButton = page.getByTestId('btn-filter-clear');

    this.detailButton = page.getByTestId('btn-detail');
    this.editButton = page.getByTestId('btn-edit');
    this.exportButton = page.getByTestId('btn-export');

    this.form = page.getByTestId('action-form');
    this.inputCode = page.getByTestId('input-code');
    this.inputName = page.getByTestId('input-name');
    this.inputDescription = page.getByTestId('input-description');
    this.selectType = page.getByTestId('select-type');
    this.inputTypeReadonly = page.getByTestId('input-type-readonly');
    this.inputCreatedAt = page.getByTestId('input-created-at');
    this.inputLastModifiedAt = page.getByTestId('input-last-modified-at');
    this.saveButton = page.getByTestId('btn-save');
    this.cancelButton = page.getByTestId('btn-cancel');
    this.detailEditButton = page.getByTestId('action-form-btn-edit');
    this.backButton = page.getByTestId('action-form-btn-back');

    this.errorNotification = page.getByTestId('error-dialog');
  }

  // ── Helpers de fila ────────────────────────────────────────────────────────

  rowByCode(code: string): Locator {
    return this.rows.filter({ hasText: code });
  }

  async selectRowByCode(code: string): Promise<void> {
    await this.rowByCode(code).first().click();
  }

  // ── Navegación ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/administration/security/actions');
    await this.page.waitForURL(/\/administration\/security\/actions$/);
    await this.table.waitFor({ state: 'visible' });
    // La tabla se vuelve visible mientras aún muestra el estado de carga. Esperar
    // a la primera fila garantiza que la carga inicial terminó antes de leer.
    await this.rows.first().waitFor({ state: 'visible' });
  }

  // ── Filtros ────────────────────────────────────────────────────────────────

  async applyCodeFilter(code: string): Promise<void> {
    // Con búsqueda automática (debounce) basta rellenar el filtro, pero el botón
    // Buscar sigue disparando la consulta. Se espera la respuesta cuyo parámetro
    // `code` coincide para que la tabla refleje el filtro antes de continuar.
    const response = this.waitForActionsQuery({ code });
    await this.filterCode.fill(code);
    await this.searchButton.click();
    await response;
  }

  async applyTypeFilter(type: 'READ' | 'WRITE' | 'EXECUTE'): Promise<void> {
    // El listener debe registrarse ANTES de interactuar con el control para
    // evitar que el debounce dispare la petición antes de que esté escuchando.
    const response = this.waitForActionsQuery({ type });
    await this.filterType.selectOption(type);
    await this.searchButton.click();
    await response;
  }

  async clearFilters(): Promise<void> {
    // Tras limpiar no hay parámetros de filtro; se espera una respuesta sin
    // `code` ni `type` para no capturar la respuesta de un filtro anterior.
    const response = this.waitForActionsQuery({ noFilters: true });
    await this.clearButton.click();
    await response;
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Espera una respuesta GET del listado de acciones. Los campos de `match`
   * acotan la respuesta esperada por sus parámetros de URL para no satisfacer
   * la espera con una petición distinta aún en vuelo.
   */
  private waitForActionsQuery(match?: {
    page?: number;
    code?: string;
    type?: string;
    noFilters?: boolean;
  }): Promise<unknown> {
    return this.page.waitForResponse((response) => {
      const url = response.url();
      if (
        response.request().method() !== 'GET' ||
        !url.includes('/administration/security/actions') ||
        url.includes('/count') ||
        response.status() !== 200
      ) {
        return false;
      }
      const params = new URL(url).searchParams;
      if (match?.page !== undefined && params.get('page') !== String(match.page)) {
        return false;
      }
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

  /** Ordena por la columna indicada y espera la respuesta con el parámetro `sort`. */
  async sortBy(column: string, sortParam: string): Promise<void> {
    const response = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().includes('/administration/security/actions') &&
        !res.url().includes('/count') &&
        new URL(res.url()).searchParams.get('sort') === sortParam,
    );
    await this.columnHeader(column).click();
    await response;
  }  /** Cambia el tamaño de página mediante el selector `pagination-page-size`. */
  async setPageSize(size: number): Promise<void> {
    const response = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().includes('/administration/security/actions') &&
        !res.url().includes('/count') &&
        new URL(res.url()).searchParams.get('size') === String(size),
    );
    await this.page.getByTestId('pagination-page-size').selectOption(String(size));
    await response;
  }

  // ── Apertura de formularios ────────────────────────────────────────────────

  async openEditFormByIndex(index = 0): Promise<void> {
    await this.rows.nth(index).click();
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  async openEditFormByCode(code: string): Promise<void> {
    await this.selectRowByCode(code);
    await this.editButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  /** Abre el detalle usando el botón `btn-detail` con la fila ya seleccionada. */
  async openDetailByButton(code: string): Promise<void> {
    await this.selectRowByCode(code);
    await this.detailButton.click();
    await this.form.waitFor({ state: 'visible' });
  }

  /** Abre el detalle mediante doble clic sobre la fila del código indicado. */
  async openDetailByDoubleClick(code: string): Promise<void> {
    await this.rowByCode(code).first().dblclick();
    await this.form.waitFor({ state: 'visible' });
  }

  // ── Guardado ───────────────────────────────────────────────────────────────

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

  // ── Exportación ────────────────────────────────────────────────────────────

  async exportCsv(): Promise<import('@playwright/test').Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }
}
