import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpDeleteButtonComponent } from './delete-button.component';

/**
 * Botón de acción "Eliminar" reutilizable para las barras de herramientas de los
 * listados y las cabeceras de los formularios en modo vista. Es un botón de
 * peligro con icono de papelera que se deshabilita cuando no hay fila
 * seleccionada y emite el evento `delete` al pulsarlo.
 */
const meta: Meta<TpDeleteButtonComponent> = {
  title: 'Shared/DeleteButton',
  component: TpDeleteButtonComponent,
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
    delete: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón (p. ej. sin fila seleccionada).' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.delete.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    delete: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpDeleteButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: {
    disabled: false,
    labelKey: 'button.delete',
    testId: 'btn-delete',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-delete');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.delete).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado: típico cuando no hay ninguna fila seleccionada.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    labelKey: 'button.delete',
    testId: 'btn-delete',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-delete');
    await expect(button).toBeDisabled();
    await expect(args.delete).not.toHaveBeenCalled();
  },
};
