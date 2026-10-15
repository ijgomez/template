import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { TpInterfaceSelectComponent } from './interface-select.component';
import { InterfaceService } from '../../../../core/services/interface.service';
import { InterfaceConfig } from '../../../../core/models/interface.model';

/**
 * Crea un stub de InterfaceService que devuelve una lista fija de interfaces.
 * Evita depender del backend para que las historias sean deterministas.
 */
function stubInterfaceService(interfaces: InterfaceConfig[]): Partial<InterfaceService> {
  return {
    findAllConfigurations: () => of(interfaces),
  };
}

const interfaces: InterfaceConfig[] = [
  {
    id: 1,
    name: 'FTP',
    description: 'Transferencia de ficheros',
    url: 'ftp://example.com',
    protocol: 'SMTP',
    checkFrequency: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 2,
    name: 'Billing API',
    description: 'Integración de facturación',
    url: 'https://example.com/billing',
    protocol: 'REST',
    checkFrequency: 120,
    status: 'INACTIVE',
    createdAt: '2026-01-03T00:00:00Z',
    lastModifiedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 3,
    name: 'LDAP Corporativo',
    description: 'Directorio de usuarios',
    url: 'ldap://example.com',
    protocol: 'LDAP',
    checkFrequency: 300,
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00Z',
    lastModifiedAt: '2026-01-06T00:00:00Z',
  },
];

/**
 * Selector desplegable de una interfaz, implementado como
 * `ControlValueAccessor`. Carga internamente la lista de interfaces vía
 * `InterfaceService.findAllConfigurations()` y escribe el **nombre** de la
 * interfaz (`string`, o `''` cuando no hay selección) como valor del
 * formulario. Se usa el nombre (y no el id) porque los logs de operación de
 * interfaz se correlacionan con su interfaz por nombre, que es el campo por el
 * que filtra el backend. Soporta dos estilos de opción vacía: un placeholder
 * deshabilitado (formularios) o una opción "todas" seleccionable (filtros).
 */
const meta: Meta<TpInterfaceSelectComponent> = {
  title: 'Features/InterfaceSelect',
  component: TpInterfaceSelectComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [FormsModule] }),
    applicationConfig({
      providers: [{ provide: InterfaceService, useValue: stubInterfaceService(interfaces) }],
    }),
  ],
  argTypes: {
    placeholderKey: { control: 'text', description: 'Clave i18n de la opción vacía/placeholder.' },
    placeholderSelectable: {
      control: 'boolean',
      description: 'Si la opción vacía es seleccionable (true en filtros, false en formularios).',
    },
    required: { control: 'boolean', description: 'Añade el atributo required al select.' },
    name: { control: 'text', description: 'Atributo name del select (forms template-driven).' },
    ariaLabelKey: { control: 'text', description: 'Clave i18n para el aria-label del select.' },
    testId: { control: 'text', description: 'Valor data-testid del select.' },
  },
};

export default meta;
type Story = StoryObj<TpInterfaceSelectComponent>;

/**
 * Uso en filtro: opción "todas las interfaces" seleccionable.
 */
export const Filter: Story = {
  args: {
    placeholderKey: 'interfaces.interfaceList.filters.allInterfaces',
    placeholderSelectable: true,
    required: false,
    name: 'filterInterface',
    ariaLabelKey: 'interfaces.interfaceList.fields.interfaceName',
    testId: 'interface-list-filter-interface',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('interface-list-filter-interface');
    await userEvent.selectOptions(select, 'FTP');
    await expect(select).toHaveValue('FTP');
    await userEvent.selectOptions(select, '');
    await expect(select).toHaveValue('');
  },
};

/**
 * Uso en formulario: interfaz obligatoria con placeholder deshabilitado.
 */
export const FormRequired: Story = {
  args: {
    placeholderKey: 'interfaces.interfaceList.fields.interfaceName',
    placeholderSelectable: false,
    required: true,
    name: 'interfaceName',
    ariaLabelKey: 'interfaces.interfaceList.fields.interfaceName',
    testId: 'select-interface',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('select-interface');
    await userEvent.selectOptions(select, 'Billing API');
    await expect(select).toHaveValue('Billing API');
    await userEvent.tab();
  },
};

/**
 * Sin interfaces disponibles: el select solo muestra la opción vacía.
 */
export const NoInterfaces: Story = {
  args: {
    ...Filter.args,
  },
  decorators: [
    applicationConfig({
      providers: [{ provide: InterfaceService, useValue: stubInterfaceService([]) }],
    }),
  ],
};

/**
 * Cobertura de comportamiento CVA con ngModel y estado disabled.
 */
export const CvaIntegration: Story = {
  args: {
    ...FormRequired.args,
    testId: 'cva-interface',
  },
  render: args => ({
    props: {
      ...args,
      interfaceName: 'LDAP Corporativo',
      disabledState: false,
    },
    template: `
      <form>
        <tp-interface-select
          [(ngModel)]="interfaceName"
          [disabled]="disabledState"
          [placeholderKey]="placeholderKey"
          [placeholderSelectable]="placeholderSelectable"
          [required]="required"
          [name]="name"
          [ariaLabelKey]="ariaLabelKey"
          [testId]="testId">
        </tp-interface-select>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('cva-interface');
    await userEvent.selectOptions(select, 'FTP');
    await expect(select).toHaveValue('FTP');
  },
};

/**
 * Requerido sin selección: al perder foco debe marcarse como inválido.
 */
export const RequiredWithoutSelection: Story = {
  args: {
    ...FormRequired.args,
    testId: 'required-empty-interface',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('required-empty-interface');
    await userEvent.click(select);
    await userEvent.tab();
    await expect(select).toHaveClass('is-invalid');
  },
};
