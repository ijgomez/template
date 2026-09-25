import type { Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';

// Estilos globales de la aplicación (Bootstrap, iconos y tokens del design system).
import '../src/styles.scss';

const preview: Preview = {
  // Providers de aplicación disponibles para todas las historias.
  // Cubre los componentes que dependen de HttpClient o @ngx-translate.
  // Las historias que necesiten enrutado deben aportar su propio provideRouter.
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    a11y: {
      // Comportamiento de los tests de accesibilidad al ejecutarse junto al
      // addon de Vitest:
      //   'off'   -> no se ejecutan (solo verificación manual en el panel)
      //   'todo'  -> se ejecutan; las violaciones se muestran como advertencia
      //   'error' -> se ejecutan; las violaciones hacen fallar el test (UI y CI)
      // Empezamos en 'todo' para hacer visibles las violaciones sin bloquear.
      test: 'todo',
    },
  },
  tags: ['autodocs'],
};

export default preview;
