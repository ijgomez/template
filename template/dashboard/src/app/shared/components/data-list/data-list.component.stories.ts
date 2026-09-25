import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { TpDataListComponent } from './data-list.component';
import { TpListItemDirective } from './directives/tp-list-item.directive';

/**
 * Elemento de ejemplo usado en las historias del data-list.
 */
interface DemoAction {
  id: number;
  code: string;
  name: string;
}

const data: DemoAction[] = [
  { id: 1, code: 'USER_READ', name: 'Consultar usuarios' },
  { id: 2, code: 'USER_WRITE', name: 'Editar usuarios' },
  { id: 3, code: 'REPORT_EXEC', name: 'Ejecutar informes' },
];

const meta: Meta<TpDataListComponent<DemoAction>> = {
  title: 'Shared/DataList',
  component: TpDataListComponent,
  tags: ['autodocs'],
  decorators: [
    // La directiva estructural tpListItem debe estar disponible para el template.
    moduleMetadata({ imports: [TpListItemDirective] }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Lista reutilizable con cabecera, filtro, paginación, estados de carga/vacío ' +
          'y plantillas de elemento personalizadas mediante la directiva `tpListItem`. ' +
          'Sigue el mismo patrón de diseño que `TpDataTableComponent`, pero renderiza los ' +
          'elementos como una lista vertical (list-group) en lugar de una tabla.',
      },
    },
  },
  argTypes: {
    data: { description: 'Elementos de datos de la página actual.' },
    loading: { control: 'boolean', description: 'Indica si los datos se están cargando.' },
    totalElements: { control: 'number', description: 'Número total de elementos (para paginación).' },
    currentPage: { control: 'number', description: 'Índice de la página actual (base 0).' },
    pageSize: { control: 'number', description: 'Número de elementos por página.' },
    title: { control: 'text', description: 'Título mostrado en la cabecera.' },
    filterable: { control: 'boolean', description: 'Muestra u oculta el campo de filtro.' },
    showAdd: { control: 'boolean', description: 'Muestra u oculta el botón de añadir.' },
    showRemove: { control: 'boolean', description: 'Muestra u oculta los botones de eliminar por elemento.' },
    showPagination: { control: 'boolean', description: 'Muestra u oculta los controles de paginación.' },
    disabled: { control: 'boolean', description: 'Deshabilita el componente.' },
    ariaLabel: { control: 'text', description: 'Etiqueta de accesibilidad para la lista.' },
    testId: { control: 'text', description: 'Prefijo data-testid para testing.' },
  },
  // Render con template personalizado (tpListItem) para mostrar cada elemento.
  render: args => ({
    props: args,
    template: `
      <tp-data-list
        [data]="data"
        [loading]="loading"
        [totalElements]="totalElements"
        [currentPage]="currentPage"
        [pageSize]="pageSize"
        [title]="title"
        [filterable]="filterable"
        [filterText]="filterText"
        [showAdd]="showAdd"
        [showRemove]="showRemove"
        [showPagination]="showPagination"
        [disabled]="disabled"
        [ariaLabel]="ariaLabel"
        [testId]="testId">
        <ng-template tpListItem let-item>
          <span class="badge bg-secondary-subtle text-secondary me-2">{{ item.code }}</span>
          <span>{{ item.name }}</span>
        </ng-template>
      </tp-data-list>
    `,
  }),
};

export default meta;
type Story = StoryObj<TpDataListComponent<DemoAction>>;

/**
 * Lista con datos, filtro, botones de añadir/eliminar y paginación.
 */
export const Default: Story = {
  args: {
    data,
    loading: false,
    totalElements: 3,
    currentPage: 0,
    pageSize: 5,
    title: 'Acciones asignadas',
    filterable: true,
    filterText: '',
    showAdd: true,
    showRemove: true,
    showPagination: true,
    disabled: false,
    ariaLabel: 'Lista de acciones asignadas',
    testId: 'assigned-actions',
  },
};

/**
 * Estado de carga.
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
    data: [],
  },
};

/**
 * Estado vacío sin elementos.
 */
export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    totalElements: 0,
  },
};

/**
 * Lista de solo lectura (deshabilitada, sin botones de acción).
 */
export const ReadOnly: Story = {
  args: {
    ...Default.args,
    disabled: true,
    showAdd: false,
    showRemove: false,
  },
};
