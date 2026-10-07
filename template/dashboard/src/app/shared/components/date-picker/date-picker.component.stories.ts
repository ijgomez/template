import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { expect, userEvent, within } from 'storybook/test';

import { TpDatePickerComponent } from './date-picker.component';

const meta: Meta<TpDatePickerComponent> = {
  title: 'Shared/DatePicker',
  component: TpDatePickerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [ReactiveFormsModule] })],
  argTypes: {
    id: { control: 'text', description: 'Atributo id del input date.' },
    name: { control: 'text', description: 'Atributo name del input date.' },
    required: { control: 'boolean', description: 'Marca el control como requerido.' },
    ariaLabel: { control: 'text', description: 'Etiqueta accesible del input.' },
    testId: { control: 'text', description: 'Valor data-testid del input.' },
    invalid: { control: 'boolean', description: 'Aplica estilo de validacion invalida.' },
  },
  args: {
    id: 'birthDate',
    name: 'birthDate',
    required: false,
    ariaLabel: 'Fecha',
    testId: 'date-picker',
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<TpDatePickerComponent>;

/**
 * Estado por defecto para seleccionar una fecha.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('date-picker');
    await userEvent.type(input, '2026-10-07');
    await expect(input).toHaveValue('2026-10-07');
  },
};

/**
 * Estado invalido para mostrar feedback visual de validacion.
 */
export const Invalid: Story = {
  args: {
    invalid: true,
    required: true,
  },
};

/**
 * Variante requerida para flujos con validacion obligatoria.
 */
export const Required: Story = {
  args: {
    required: true,
  },
};

/**
 * Integra el componente como CVA con FormControl para cubrir writeValue y setDisabledState.
 */
export const CvaWithFormControl: Story = {
  args: {
    testId: 'date-picker-cva',
  },
  render: args => {
    const control = new FormControl<string | null>('2026-10-07');
    return {
      props: {
        ...args,
        control,
        setNullValue: () => control.setValue(null),
        disableControl: () => control.disable(),
      },
      template: `
        <tp-date-picker
          [id]="id"
          [name]="name"
          [required]="required"
          [ariaLabel]="ariaLabel"
          [testId]="testId"
          [invalid]="invalid"
          [formControl]="control">
        </tp-date-picker>

        <button type="button" data-testid="btn-set-null" (click)="setNullValue()">Set null</button>
        <button type="button" data-testid="btn-disable" (click)="disableControl()">Disable</button>
      `,
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('date-picker-cva');

    await expect(input).toHaveValue('2026-10-07');
    await userEvent.click(canvas.getByTestId('btn-set-null'));
    await expect(input).toHaveValue('');

    await userEvent.click(canvas.getByTestId('btn-disable'));
    await expect(input).toBeDisabled();
  },
};
