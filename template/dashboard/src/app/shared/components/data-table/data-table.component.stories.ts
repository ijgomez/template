import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TpDataTableComponent } from './data-table.component';
import { ColumnDef } from './models/column-def.model';
import { TpColumnDirective } from './directives/tp-column.directive';

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
  decorators: [moduleMetadata({ imports: [TpColumnDirective] })],
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
    totalElements: 3,
    ariaLabel: 'Users table',
    testId: 'users-table',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameHeader = canvas.getByTestId('users-table-th-name');
    await expect(canvas.getByTestId('users-table')).toBeInTheDocument();

    // Sort cycle on the same column: asc -> desc -> none.
    await userEvent.click(nameHeader);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(nameHeader);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(nameHeader);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // Switching to another sortable column starts at asc.
    await userEvent.click(canvas.getByTestId('users-table-th-email'));
    await expect(canvas.getByTestId('users-table-th-email')).toHaveAttribute('aria-sort', 'ascending');

    // Non-sortable column keeps aria-sort at none.
    await userEvent.click(canvas.getByTestId('users-table-th-role'));
    await expect(canvas.getByTestId('users-table-th-role')).toHaveAttribute('aria-sort', 'none');

    // Row click + page-size selector interaction.
    await userEvent.click(canvas.getByText('Ada Lovelace'));
    await userEvent.dblClick(canvas.getByText('Alan Turing'));
    await userEvent.selectOptions(canvas.getByTestId('pagination-page-size'), '20');
    await expect(canvas.getByTestId('pagination-page-size')).toBeVisible();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('common.noData')).toBeInTheDocument();
  },
};

/**
 * Con fila seleccionada.
 */
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedItem: { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'User' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alanRow = canvas.getByRole('row', { name: /alan turing/i });
    await expect(alanRow).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Estado con varias paginas para cubrir navegacion de paginacion.
 */
export const Paginated: Story = {
  args: {
    ...Default.args,
    pageSize: 2,
    totalElements: 30,
    currentPage: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('pagination-prev')).toBeInTheDocument();
    await expect(canvas.getByTestId('pagination-next')).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId('pagination-prev'));
    await userEvent.click(canvas.getByRole('link', { name: '3' }));
    await userEvent.click(canvas.getByTestId('pagination-next'));
  },
};

/**
 * Usa una plantilla de celda custom para cubrir la directiva tpColumn.
 */
export const WithCustomCellTemplate: Story = {
  args: {
    ...Default.args,
    testId: 'users-table-custom',
  },
  render: args => ({
    props: args,
    template: `
      <tp-data-table
        [columns]="columns"
        [data]="data"
        [loading]="loading"
        [selectable]="selectable"
        [currentPage]="currentPage"
        [pageSize]="pageSize"
        [totalElements]="totalElements"
        [ariaLabel]="ariaLabel"
        [testId]="testId">
        <ng-template tpColumn="role" let-item>
          <span data-testid="role-cell">Role: {{ item.role }}</span>
        </ng-template>
      </tp-data-table>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByTestId('role-cell')[0]).toHaveTextContent('Role: Admin');
  },
};

/**
 * Cubre rutas internas de resize y drag/drop con eventos controlados.
 */
export const AdvancedInteractions: Story = {
  args: {
    columns: [
      { key: 'name', header: 'Name', sortable: true, resizable: true, reorderable: true, width: '120px' },
      { key: 'email', header: 'Email', sortable: true, reorderable: true },
      { key: 'role', header: 'Role', reorderable: true },
    ],
    data,
    loading: false,
    selectable: true,
    currentPage: 1,
    pageSize: 2,
    totalElements: 30,
    ariaLabel: 'Advanced users table',
    testId: 'advanced-table',
  },
  render: args => ({
    props: {
      ...args,
      triggerResize: (table: TpDataTableComponent<DemoUser>) => {
        const th = document.querySelector('[data-testid="advanced-table-th-name"]') as HTMLElement;
        if (th) {
          Object.defineProperty(th, 'offsetWidth', { value: 120, configurable: true });
        }
        const startEvent = {
          clientX: 100,
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        } as unknown as MouseEvent;
        table.onResizeStart(startEvent, table.columns[0], th);
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 180 }));
        document.dispatchEvent(new MouseEvent('mouseup'));
      },
      triggerReorder: (table: TpDataTableComponent<DemoUser>) => {
        const dragEvent = {
          preventDefault: () => undefined,
          dataTransfer: {
            effectAllowed: '',
            dropEffect: '',
            setData: () => undefined,
          },
        } as unknown as DragEvent;
        table.onDragStart(dragEvent, table.columns[0]);
        table.onDragOver(dragEvent, table.columns[1]);
        table.onDrop(dragEvent, table.columns[1]);
        table.onDragEnd();
      },
      triggerInvalidDrop: (table: TpDataTableComponent<DemoUser>) => {
        const dragEvent = { preventDefault: () => undefined } as unknown as DragEvent;
        table.dragColumnKey = 'missing-column';
        table.onDrop(dragEvent, table.columns[0]);
      },
    },
    template: `
      <tp-data-table
        #table
        [columns]="columns"
        [data]="data"
        [loading]="loading"
        [selectable]="selectable"
        [currentPage]="currentPage"
        [pageSize]="pageSize"
        [totalElements]="totalElements"
        [ariaLabel]="ariaLabel"
        [testId]="testId">
      </tp-data-table>

      <button type="button" data-testid="btn-resize" (click)="triggerResize(table)">Resize</button>
      <button type="button" data-testid="btn-reorder" (click)="triggerReorder(table)">Reorder</button>
      <button type="button" data-testid="btn-invalid-drop" (click)="triggerInvalidDrop(table)">Invalid drop</button>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId('btn-resize'));
    await userEvent.click(canvas.getByTestId('btn-reorder'));
    await userEvent.click(canvas.getByTestId('btn-invalid-drop'));

    await expect(canvas.getByTestId('advanced-table-th-email')).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId('pagination-prev'));
  },
};
