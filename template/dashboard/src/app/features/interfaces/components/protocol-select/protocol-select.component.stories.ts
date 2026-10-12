import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { FormsModule } from '@angular/forms';
import { expect, userEvent, within } from 'storybook/test';

import { ProtocolSelectComponent } from './protocol-select.component';

/**
 * Selector del protocolo de una interfaz, implementado como
 * `ControlValueAccessor`. La lista de protocolos (`REST`, `SOAP`, `LDAP`,
 * `SMTP`) es estática, por lo que no depende de ningún servicio. Escribe el
 * protocolo (`string`, o `''` cuando no hay selección) como valor del
 * formulario y soporta dos variantes de render:
 *
 * - `select`: `<select>` editable, con opción vacía seleccionable opcional
 *   (filtros con "todos los protocolos").
 * - `readonly`: `<input readonly disabled>` que muestra el valor textual
 *   (vista de solo lectura del formulario de interfaz).
 */
const meta: Meta<ProtocolSelectComponent> = {
  title: 'Features/ProtocolSelect',
  component: ProtocolSelectComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [FormsModule] })],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['select', 'readonly'],
      description: 'Variante de render: select editable o input de solo lectura.',
    },
    placeholderKey: { control: 'text', description: 'Clave i18n de la opción vacía/placeholder.' },
    placeholderSelectable: {
      control: 'boolean',
      description: 'Si la opción vacía es seleccionable (true en filtros, false en formularios).',
    },
    required: { control: 'boolean', description: 'Añade el atributo required al select.' },
    name: { control: 'text', description: 'Atributo name del control (forms template-driven).' },
    ariaLabelKey: { control: 'text', description: 'Clave i18n para el aria-label del control.' },
    testId: { control: 'text', description: 'Valor data-testid del control.' },
  },
};

export default meta;
type Story = StoryObj<ProtocolSelectComponent>;

/**
 * Uso en filtro: opción "todos los protocolos" seleccionable.
 */
export const Filter: Story = {
  args: {
    variant: 'select',
    placeholderKey: 'interfaces.configuration.filters.allProtocols',
    placeholderSelectable: true,
    required: false,
    name: 'filterProtocol',
    ariaLabelKey: 'interfaces.configuration.fields.protocol',
    testId: 'filter-protocol',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('filter-protocol');
    await userEvent.selectOptions(select, 'SOAP');
    await expect(select).toHaveValue('SOAP');
    await userEvent.selectOptions(select, '');
    await expect(select).toHaveValue('');
  },
};

/**
 * Uso en formulario: protocolo obligatorio con placeholder deshabilitado.
 */
export const FormRequired: Story = {
  args: {
    variant: 'select',
    placeholderKey: 'interfaces.configuration.fields.protocol',
    placeholderSelectable: false,
    required: true,
    name: 'protocol',
    ariaLabelKey: 'interfaces.configuration.fields.protocol',
    testId: 'select-protocol',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('select-protocol');
    await userEvent.selectOptions(select, 'REST');
    await expect(select).toHaveValue('REST');
    await userEvent.tab();
  },
};

/**
 * Variante de solo lectura: input deshabilitado con el valor textual del protocolo.
 */
export const Readonly: Story = {
  args: {
    variant: 'readonly',
    name: 'protocol',
    ariaLabelKey: 'interfaces.configuration.fields.protocol',
    testId: 'input-protocol',
  },
  render: args => ({
    props: { ...args, protocol: 'LDAP' },
    template: `
      <form>
        <tp-protocol-select
          [ngModel]="protocol"
          [variant]="variant"
          [name]="name"
          [ariaLabelKey]="ariaLabelKey"
          [testId]="testId">
        </tp-protocol-select>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('input-protocol') as HTMLInputElement;
    await expect(input).toHaveValue('LDAP');
    await expect(input).toBeDisabled();
    await expect(input.readOnly).toBe(true);
  },
};

/**
 * Cobertura de comportamiento CVA con ngModel y estado disabled.
 */
export const CvaIntegration: Story = {
  args: {
    ...FormRequired.args,
    testId: 'cva-protocol',
  },
  render: args => ({
    props: {
      ...args,
      protocol: 'SMTP',
      disabledState: false,
    },
    template: `
      <form>
        <tp-protocol-select
          [(ngModel)]="protocol"
          [disabled]="disabledState"
          [variant]="variant"
          [placeholderKey]="placeholderKey"
          [placeholderSelectable]="placeholderSelectable"
          [required]="required"
          [name]="name"
          [ariaLabelKey]="ariaLabelKey"
          [testId]="testId">
        </tp-protocol-select>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('cva-protocol');
    await userEvent.selectOptions(select, 'REST');
    await expect(select).toHaveValue('REST');
  },
};

/**
 * Requerido sin selección: al perder foco debe marcarse como inválido.
 */
export const RequiredWithoutSelection: Story = {
  args: {
    ...FormRequired.args,
    testId: 'required-empty-protocol',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('required-empty-protocol');
    await userEvent.click(select);
    await userEvent.tab();
    await expect(select).toHaveClass('is-invalid');
  },
};
