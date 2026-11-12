import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpClearButtonComponent } from './clear-button.component';

/**
 * Botón de acción "Limpiar" reutilizable para los formularios de filtros de los listados. Muestra un icono de círculo con x y emite el evento clear al pulsarlo.
 */
const meta: Meta<TpClearButtonComponent> = {
  title: 'Shared/ClearButton',
  component: TpClearButtonComponent,
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
    clear: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón.' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.clear.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    clear: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpClearButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: { disabled: false, labelKey: 'button.clear', testId: 'btn-filter-clear' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-filter-clear');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.clear).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado.
 */
export const Disabled: Story = {
  args: { disabled: true, labelKey: 'button.clear', testId: 'btn-filter-clear' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-filter-clear');
    await expect(button).toBeDisabled();
    await expect(args.clear).not.toHaveBeenCalled();
  },
};
