import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpCreateButtonComponent } from './create-button.component';

/**
 * Botón de acción "Crear" reutilizable para las barras de herramientas de los
 * listados. Es un botón primario con icono de más que emite el evento `create`
 * al pulsarlo. La etiqueta y el `data-testid` son configurables mediante inputs.
 */
const meta: Meta<TpCreateButtonComponent> = {
  title: 'Shared/CreateButton',
  component: TpCreateButtonComponent,
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
    create: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón.' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto button.create.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    create: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpCreateButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: {
    disabled: false,
    labelKey: 'button.create',
    testId: 'btn-create',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-create');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.create).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    labelKey: 'button.create',
    testId: 'btn-create',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-create');
    await expect(button).toBeDisabled();
    await expect(args.create).not.toHaveBeenCalled();
  },
};
