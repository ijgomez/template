import type { Meta, StoryObj } from '@storybook/angular-vite';
import { TpDataTableComponent } from './data-table.component';
import { ColumnDef } from './models/column-def.model';

/**
 * Fila de ejemplo usada en las historias del data-table.
 */
interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: ColumnDef[] = [
  { key: 'name', header: 'Name', sortable: true, resizable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role' },
];

const data: DemoUser[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'User' },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
];

const meta: Meta<TpDataTableComponent<DemoUser>> = {
  title: 'Shared/DataTable',
  component: TpDataTableComponent,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    selectable: { control: 'boolean' },
    pageSize: { control: 'number' },
    currentPage: { control: 'number' },
    totalElements: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<TpDataTableComponent<DemoUser>>;

/**
 * Tabla con datos y paginación básica.
 */
export const Default: Story = {
  args: {
    columns,
    data,
    loading: false,
    selectable: true,
    currentPage: 0,
    pageSize: 10,
    totalElements: data.length,
    ariaLabel: 'Users table',
    testId: 'users-table',
  },
};

/**
 * Estado de carga: muestra el indicador de loading.
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
    data: [],
  },
};

/**
 * Estado vacío: sin filas de datos.
 */
export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    totalElements: 0,
  },
};

/**
 * Con fila seleccionada.
 */
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedItem: data[1],
  },
};
