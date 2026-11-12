import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpFilterButtonComponent } from './filter-button.component';

/**
 * Botón de acción "Filtrar" reutilizable para los formularios de filtros de los listados. Es un botón primario con icono de lupa; por defecto es de tipo submit para activar el (ngSubmit) del formulario.
 */
const meta: Meta<TpFilterButtonComponent> = {
  title: 'Shared/FilterButton',
  component: TpFilterButtonComponent,
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
    filter: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón.' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.filter.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    filter: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpFilterButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: { disabled: false, labelKey: 'button.filter', testId: 'btn-filter-search' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-filter-search');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.filter).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado.
 */
export const Disabled: Story = {
  args: { disabled: true, labelKey: 'button.filter', testId: 'btn-filter-search' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-filter-search');
    await expect(button).toBeDisabled();
    await expect(args.filter).not.toHaveBeenCalled();
  },
};
