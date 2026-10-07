import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { TpProfileSelectComponent } from './profile-select.component';
import { UserService } from '../../../core/services/user.service';
import { ProfileRef } from '../../../core/models/user.model';

/**
 * Crea un stub de UserService que devuelve una lista fija de perfiles.
 * Evita depender del backend para que las historias sean deterministas.
 */
function stubUserService(profiles: ProfileRef[]): Partial<UserService> {
  return {
    getProfiles: () => of(profiles),
  };
}

const profiles: ProfileRef[] = [
  { id: 1, name: 'Administrador' },
  { id: 2, name: 'Operador' },
  { id: 3, name: 'Consulta' },
];

/**
 * Selector desplegable de un único perfil de seguridad, implementado como
 * `ControlValueAccessor`. Carga internamente la lista de perfiles vía
 * `UserService.getProfiles()` y escribe el ID del perfil (`number | null`)
 * como valor del formulario. Soporta dos estilos de opción vacía: un
 * placeholder deshabilitado (formularios) o una opción "todos" seleccionable
 * (filtros).
 */
const meta: Meta<TpProfileSelectComponent> = {
  title: 'Features/ProfileSelect',
  component: TpProfileSelectComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [FormsModule] }),
    applicationConfig({
      providers: [{ provide: UserService, useValue: stubUserService(profiles) }],
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
type Story = StoryObj<TpProfileSelectComponent>;

/**
 * Uso en formulario: perfil obligatorio con placeholder deshabilitado.
 */
export const FormRequired: Story = {
  args: {
    placeholderKey: 'users.form.selectProfile',
    placeholderSelectable: false,
    required: true,
    name: 'profileId',
    ariaLabelKey: 'users.fields.profile',
    testId: 'select-profile',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('select-profile');
    await userEvent.selectOptions(select, '2');
    await expect(select).toHaveValue('2');
    await userEvent.tab();
  },
};

/**
 * Uso en filtro: opción "todos los perfiles" seleccionable.
 */
export const Filter: Story = {
  args: {
    placeholderKey: 'users.filters.allProfiles',
    placeholderSelectable: true,
    required: false,
    name: 'filterProfile',
    ariaLabelKey: 'users.fields.profile',
    testId: 'filter-profile',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('filter-profile');
    await userEvent.selectOptions(select, '');
    await expect(select).toHaveValue('');
  },
};

/**
 * Sin perfiles disponibles: el select solo muestra la opción vacía.
 */
export const NoProfiles: Story = {
  args: {
    ...Filter.args,
  },
  decorators: [
    applicationConfig({
      providers: [{ provide: UserService, useValue: stubUserService([]) }],
    }),
  ],
};

/**
 * Cobertura de comportamiento CVA con ngModel y estado disabled.
 */
export const CvaIntegration: Story = {
  args: {
    ...FormRequired.args,
    testId: 'cva-profile',
  },
  render: args => ({
    props: {
      ...args,
      profileId: 2,
      disabledState: false,
    },
    template: `
      <form>
        <tp-profile-select
          [(ngModel)]="profileId"
          [disabled]="disabledState"
          [placeholderKey]="placeholderKey"
          [placeholderSelectable]="placeholderSelectable"
          [required]="required"
          [name]="name"
          [ariaLabelKey]="ariaLabelKey"
          [testId]="testId">
        </tp-profile-select>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('cva-profile');

    await userEvent.selectOptions(select, '1');
    await expect(select).toHaveValue('1');
  },
};

/**
 * Requerido sin seleccion: al perder foco debe marcarse como invalido.
 */
export const RequiredWithoutSelection: Story = {
  args: {
    ...FormRequired.args,
    testId: 'required-empty-profile',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByTestId('required-empty-profile');
    await userEvent.click(select);
    await userEvent.tab();
    await expect(select).toHaveClass('is-invalid');
  },
};
