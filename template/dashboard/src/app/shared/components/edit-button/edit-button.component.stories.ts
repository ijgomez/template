import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpEditButtonComponent } from './edit-button.component';

/**
 * Botón de acción "Editar" reutilizable para las barras de herramientas de los
 * listados y las cabeceras de los formularios en modo vista. Muestra un icono
 * de lápiz, se deshabilita cuando no hay fila seleccionada y emite el evento
 * `edit` al pulsarlo. La etiqueta, el `data-testid` y la variante visual son
 * configurables mediante inputs.
 */
const meta: Meta<TpEditButtonComponent> = {
  title: 'Shared/EditButton',
  component: TpEditButtonComponent,
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
    edit: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón (p. ej. sin fila seleccionada).' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.edit.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    variant: {
      control: 'select',
      options: ['outline-secondary', 'primary'],
      description: 'Estilo visual: outline-secondary (listados) o primary (cabeceras de formulario).',
    },
    edit: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpEditButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: {
    disabled: false,
    labelKey: 'button.edit',
    testId: 'btn-edit',
    variant: 'outline-secondary',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-edit');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.edit).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado: típico cuando no hay ninguna fila seleccionada.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    labelKey: 'button.edit',
    testId: 'btn-edit',
    variant: 'outline-secondary',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-edit');
    await expect(button).toBeDisabled();
    await expect(args.edit).not.toHaveBeenCalled();
  },
};

/**
 * Variante primaria, usada en la cabecera de los formularios en modo vista.
 */
export const Primary: Story = {
  args: {
    disabled: false,
    labelKey: 'button.edit',
    testId: 'form-btn-edit',
    variant: 'primary',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('form-btn-edit')).toHaveClass('btn-primary');
  },
};
