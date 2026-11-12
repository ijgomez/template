import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpExecuteButtonComponent } from './execute-button.component';

/**
 * Botón de acción "Ejecutar" reutilizable (p. ej. ejecución de informes). Es un botón primario con icono de play; por defecto es de tipo submit.
 */
const meta: Meta<TpExecuteButtonComponent> = {
  title: 'Shared/ExecuteButton',
  component: TpExecuteButtonComponent,
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
    execute: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón.' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.execute.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    execute: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpExecuteButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: { disabled: false, labelKey: 'button.execute', testId: 'btn-execute' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-execute');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.execute).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado.
 */
export const Disabled: Story = {
  args: { disabled: true, labelKey: 'button.execute', testId: 'btn-execute' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-execute');
    await expect(button).toBeDisabled();
    await expect(args.execute).not.toHaveBeenCalled();
  },
};
