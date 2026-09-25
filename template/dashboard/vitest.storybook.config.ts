import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Configuración de Vitest dedicada a ejecutar las historias de Storybook como
// tests de componente. Es independiente de `vitest.config.ts` (usada por el
// builder @angular/build:unit-test para los *.spec.ts), de modo que ambos
// conjuntos de tests pueden ejecutarse por separado sin interferir.
export default defineConfig({
  plugins: [
    // Bridge necesario para ejecutar Vitest en modo standalone con Angular
    // (registra el compilador de Angular para las historias).
    storybookAngularVitest(),
    storybookTest({
      configDir: `${dirname}.storybook`,
      // Arranca Storybook automáticamente en modo watch para depurar fallos.
      storybookScript: 'npm run storybook -- --ci',
    }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      // Vitest 4 requiere un factory de provider (antes era un string).
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      reportsDirectory: 'target/coverage/storybook',
    },
  },
});
