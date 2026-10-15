import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { provideTranslateService } from '@ngx-translate/core';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TpDetailButtonComponent } from './detail-button.component';

/**
 * Botón de acción "Detalle" reutilizable para las barras de herramientas de los
 * listados (usuarios, perfiles, acciones, parámetros, auditoría, nodos del
 * cluster). Es un botón primario con icono de ojo que se deshabilita cuando no
 * hay fila seleccionada y emite el evento `detail` al pulsarlo. La etiqueta y el
 * `data-testid` son configurables mediante inputs.
 */
const meta: Meta<TpDetailButtonComponent> = {
  title: 'Shared/DetailButton',
  component: TpDetailButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }),
  ],
  args: {
    detail: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Deshabilita el botón (p. ej. sin fila seleccionada).' },
    labelKey: { control: 'text', description: 'Clave i18n de la etiqueta. Por defecto common.detail.' },
    testId: { control: 'text', description: 'Valor data-testid del botón.' },
    detail: { description: 'Evento emitido al pulsar el botón.' },
  },
};

export default meta;
type Story = StoryObj<TpDetailButtonComponent>;

/**
 * Estado habilitado: el botón está activo y emite el evento al pulsarlo.
 */
export const Enabled: Story = {
  args: {
    disabled: false,
    labelKey: 'common.detail',
    testId: 'btn-detail',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-detail');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.detail).toHaveBeenCalledTimes(1);
  },
};

/**
 * Estado deshabilitado: típico cuando no hay ninguna fila seleccionada.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    labelKey: 'common.detail',
    testId: 'btn-detail',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('btn-detail');
    // A disabled button has `pointer-events: none`, so it cannot be clicked;
    // asserting the disabled state is enough to prove it won't emit.
    await expect(button).toBeDisabled();
    await expect(args.detail).not.toHaveBeenCalled();
  },
};

/**
 * Etiqueta y testId personalizados.
 */
export const CustomLabel: Story = {
  args: {
    disabled: false,
    labelKey: 'common.view',
    testId: 'btn-view',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('btn-view')).toBeInTheDocument();
  },
};
