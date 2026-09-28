import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object del formulario de login.
 *
 * Encapsula la interacción con la pantalla `/login` usando los `data-testid`
 * definidos en `login.component.html`.
 */
export class LoginPage {
  private readonly page: Page;
  readonly title: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberCheckbox: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('login-title');
    this.usernameInput = page.getByTestId('input-username');
    this.passwordInput = page.getByTestId('input-password');
    this.rememberCheckbox = page.getByTestId('checkbox-remember');
    this.submitButton = page.getByTestId('btn-login-submit');
    this.togglePasswordButton = page.getByTestId('btn-toggle-password');
    this.errorAlert = page.getByTestId('login-error-alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Realiza el login y espera a que se complete la navegación al dashboard.
   */
  async loginAndWaitForDashboard(username: string, password: string): Promise<void> {
    await this.login(username, password);
    await this.page.waitForURL(/\/dashboard$/);
  }
}
