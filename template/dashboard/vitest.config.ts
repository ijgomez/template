import { defineConfig } from 'vitest/config';

// Configuración del runner Vitest usada por el builder @angular/build:unit-test.
// Únicamente se ajusta el directorio de salida del informe de cobertura para
// que se genere dentro de `target/` (junto al resto de artefactos de build).
export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: 'target/coverage/dashboard',
    },
  },
});
