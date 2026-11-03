import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object del buscador global del header.
 *
 * Usa los `data-testid` definidos en `global-search.component.html`.
 */
export class GlobalSearchPage {
  private readonly page: Page;
  readonly input: Locator;
  readonly popup: Locator;
  readonly groups: Locator;
  readonly results: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByTestId('input-global-search');
    this.popup = page.getByTestId('global-search-popup');
    this.groups = page.locator('[data-testid^="global-search-group-"]');
    this.results = page.getByTestId('global-search-result');
    this.emptyState = page.getByTestId('global-search-empty');
  }

  async search(term: string): Promise<void> {
    await this.input.fill(term);
  }

  group(type: string): Locator {
    return this.page.getByTestId(`global-search-group-${type}`);
  }

  async openFirstResult(): Promise<void> {
    await this.results.first().click();
  }
}
