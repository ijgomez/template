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
  },
  tags: ['autodocs'],
};

export default preview;
