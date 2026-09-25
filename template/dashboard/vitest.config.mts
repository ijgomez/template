import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Configuración del runner Vitest.
//
// Esta config la consumen DOS herramientas distintas:
//
// 1. El builder @angular/build:unit-test (comando `ng test`), que ejecuta los
//    *.spec.ts. El builder IGNORA `test.projects` (lo elimina con un aviso) y
//    usa únicamente la configuración raíz de `test` (p. ej. `coverage`).
//
// 2. El addon @storybook/addon-vitest, que al lanzar los tests desde la UI de
//    Storybook busca un proyecto llamado `storybook` dentro de esta config.
//    Por eso el proyecto de Storybook debe declararse aquí, en `test.projects`,
//    y no en un fichero aparte (el addon no descubre otros nombres de config).
//
// Resultado: `ng test` sigue ejecutando solo los *.spec.ts y los tests de
// historias se ejecutan de forma aislada mediante el proyecto `storybook`.
export default defineConfig({
  test: {
    // Usada por el builder de Angular para los *.spec.ts.
    coverage: {
      reportsDirectory: 'target/coverage/dashboard',
    },
    // Proyecto dedicado a ejecutar las historias de Storybook como tests de
    // componente. El builder de Angular ignora este bloque; solo lo usa el
    // addon de Storybook (UI) y el script `test-storybook`.
    projects: [
      {
        plugins: [
          // Bridge necesario para ejecutar Vitest en modo standalone con Angular
          // (registra el compilador de Angular para las historias).
          storybookAngularVitest(),
          // El plugin reescribe el nombre del proyecto a `storybook:<configDir>`,
          // que es lo que el addon espera arrancar.
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
        },
      },
    ],
  },
});
