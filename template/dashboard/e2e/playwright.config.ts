import { defineConfig } from '@playwright/test';

/**
 * Configuración de Playwright para los tests E2E del dashboard.
 *
 * - `webServer` levanta automáticamente el frontend con `ng serve --configuration=test`
 *   (perfil `test`, apiUrl apuntando al backend de integración) antes de ejecutar los tests.
 * - Se generan reportes HTML y JUnit XML para el pipeline de CI.
 * - Los artefactos (reportes, resultados) se ubican bajo `target/` para no ensuciar el repo.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '../target/playwright-report', open: 'never' }],
    ['junit', { outputFile: '../target/playwright/results.xml' }],
    ['list'],
  ],
  outputDir: '../target/playwright/results',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  webServer: {
    command: 'npm run start -- --configuration=test',
    cwd: '..',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
