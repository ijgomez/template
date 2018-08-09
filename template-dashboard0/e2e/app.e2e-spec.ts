import { TemplateDashboardPage } from './app.po';

describe('template-dashboard App', () => {
  let page: TemplateDashboardPage;

  beforeEach(() => {
    page = new TemplateDashboardPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
