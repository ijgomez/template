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
  parameters: {
    docs: {
      description: {
        component:
          'Tabla de datos reutilizable con paginación, selección de filas, ordenación de ' +
          'columnas, redimensionado y reordenación de columnas (drag & drop), estados de ' +
          'carga/vacío y plantillas de celda personalizadas. Sigue el patrón `tp-table` del ' +
          'sistema de diseño.',
      },
    },
  },
  argTypes: {
    columns: { description: 'Definición de columnas.' },
    data: { description: 'Filas de datos de la página actual.' },
    loading: { control: 'boolean', description: 'Indica si los datos se están cargando.' },
    totalElements: { control: 'number', description: 'Número total de elementos (para paginación).' },
    currentPage: { control: 'number', description: 'Índice de la página actual (base 0).' },
    pageSize: { control: 'number', description: 'Número de elementos por página.' },
    selectable: { control: 'boolean', description: 'Indica si las filas son seleccionables.' },
    selectedItem: { description: 'Elemento seleccionado actualmente (comparado por id).' },
    ariaLabel: { control: 'text', description: 'Etiqueta de accesibilidad para la tabla.' },
    testId: { control: 'text', description: 'Atributo data-testid para el elemento de la tabla.' },
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
