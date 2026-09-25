import type { StorybookConfig } from '@storybook/angular-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/angular-vite',
    options: {},
  },
  docs: {
    defaultName: 'Docs',
  },
  staticDirs: [
    { from: '../public', to: '/' },
    { from: '../src/assets', to: '/assets' },
    // Fuentes de bootstrap-icons: styles.scss las referencia en /fonts/.
    { from: '../node_modules/bootstrap-icons/font/fonts', to: '/fonts' },
  ],
  viteFinal: config =>
    mergeConfig(config, {
      css: {
        preprocessorOptions: {
          scss: {
            // Silencia los avisos de deprecación de Sass que provienen de
            // dependencias (Bootstrap 5.3 usa @import y funciones globales
            // deprecadas en Dart Sass). No afectan a nuestro código.
            quietDeps: true,
            silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
          },
        },
      },
    }),
};

export default config;
