import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpExportButtonComponent } from './export-button.component';

/**
 * Botón de acción "Exportar" reutilizable para las barras de herramientas de los listados. Muestra un icono de descarga y emite el evento export al pulsarlo.
 */
const meta: Meta<TpExportButtonComponent> = {
  title: 'Shared/ExportButton',
  component: TpExportButtonComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        provideTranslateHttpLoader({
          prefix: './assets/i18n/',
          suffix: '.json',
        }),
      ],
    }),
  ],
  args: {
    export: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón.' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.export.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    export: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpExportButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: { disabled: false, labelKey: 'button.export', testId: 'btn-export' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-export');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.export).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado.
 */
export const Disabled: Story = {
  args: { disabled: true, labelKey: 'button.export', testId: 'btn-export' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-export');
    await expect(button).toBeDisabled();
    await expect(args.export).not.toHaveBeenCalled();
  },
};
