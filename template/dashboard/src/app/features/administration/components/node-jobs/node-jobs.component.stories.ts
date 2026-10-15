import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import { FormsModule } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { NodeJobsComponent } from './node-jobs.component';
import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClusterJob, ClusterTask } from '../../../../core/models/cluster.model';

const NODE_ID = 7;

const tasks: ClusterTask[] = [
  { id: 1, name: 'TASK_A', description: 'Tarea de limpieza', nodes: 1, minNodes: 1 },
  { id: 2, name: 'TASK_B', description: 'Tarea de sincronización', nodes: 2, minNodes: 1 },
  { id: 3, name: 'TASK_C', description: 'Tarea de reportes', nodes: 1, minNodes: 1 },
];

const jobs: ClusterJob[] = [
  { clusterNodeId: NODE_ID, clusterTaskId: 1, priority: 1, enabled: true },
  { clusterNodeId: NODE_ID, clusterTaskId: 2, priority: 5, enabled: false },
];

/**
 * Crea un stub de ClusterService que devuelve datos fijos para las historias,
 * evitando depender del backend. Todas las mutaciones devuelven observables
 * resueltos para que los flujos de guardado/borrado no fallen.
 */
function stubClusterService(nodeJobs: ClusterJob[], taskCatalogue: ClusterTask[]): Partial<ClusterService> {
  return {
    findJobsByNode: () => of(nodeJobs),
    findAllTasks: () => of(taskCatalogue),
    assignJob: () => of(nodeJobs[0]),
    updateJob: () => of(nodeJobs[0]),
    deleteJob: () => of(undefined),
  } as Partial<ClusterService>;
}

/**
 * Stub de NotificationService que no renderiza nada (las notificaciones viven
 * en un contenedor global que no forma parte de este componente).
 */
function stubNotificationService(): Partial<NotificationService> {
  return {
    showProgress: () => 'ntf-1',
    showError: () => undefined,
    updateToSuccess: () => undefined,
    updateToError: () => undefined,
    dismiss: () => undefined,
  } as Partial<NotificationService>;
}

/**
 * Panel de tareas (ClusterJob) asignadas a un nodo del cluster. Lista las
 * tareas asignadas en una `tp-data-table`, y permite asignar, editar y eliminar
 * tareas mediante modales inline. Toda la lógica vive en el componente/signals.
 * Carga sus datos de `ClusterService` (tareas del nodo y catálogo de tareas) y
 * las acciones de mutación se condicionan al permiso `CLUSTER_NODE_WRITE` de
 * `AuthService`.
 */
const meta: Meta<NodeJobsComponent> = {
  title: 'Features/NodeJobs',
  component: NodeJobsComponent,
  tags: ['autodocs'],
  args: {
    nodeId: NODE_ID,
  },
  argTypes: {
    nodeId: { control: 'number', description: 'Id del nodo cuyas tareas se gestionan.' },
  },
  decorators: [
    moduleMetadata({ imports: [FormsModule] }),
    applicationConfig({
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: stubClusterService(jobs, tasks) },
        { provide: NotificationService, useValue: stubNotificationService() },
        { provide: AuthService, useValue: { hasAction: () => true } },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<NodeJobsComponent>;

/**
 * Con permiso de escritura: se muestran el botón "Asignar" y las acciones de
 * editar/eliminar por fila.
 */
export const WithWritePermission: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('node-jobs-btn-assign')).toBeInTheDocument();
    await expect(canvas.getAllByTestId('node-jobs-btn-edit').length).toBeGreaterThan(0);
  },
};

/**
 * Sin permiso de escritura: no se muestran acciones de mutación, solo la tabla
 * en modo lectura.
 */
export const ReadOnly: Story = {
  decorators: [
    applicationConfig({
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: stubClusterService(jobs, tasks) },
        { provide: NotificationService, useValue: stubNotificationService() },
        { provide: AuthService, useValue: { hasAction: () => false } },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('node-jobs-btn-assign')).toBeNull();
    await expect(canvas.queryByTestId('node-jobs-btn-edit')).toBeNull();
  },
};

/**
 * Abre el modal de asignación al pulsar "Asignar" y lo cierra con "Cancelar".
 */
export const AssignModal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('node-jobs-btn-assign'));
    await expect(canvas.getByTestId('node-jobs-modal')).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId('node-jobs-modal-cancel'));
    await expect(canvas.queryByTestId('node-jobs-modal')).toBeNull();
  },
};

/**
 * Todas las tareas del catálogo ya están asignadas: el botón "Asignar" queda
 * deshabilitado y se muestra el mensaje de vacío.
 */
export const AllTasksAssigned: Story = {
  decorators: [
    applicationConfig({
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: ClusterService,
          useValue: stubClusterService(
            tasks.map((t) => ({ clusterNodeId: NODE_ID, clusterTaskId: t.id, priority: 1, enabled: true })),
            tasks,
          ),
        },
        { provide: NotificationService, useValue: stubNotificationService() },
        { provide: AuthService, useValue: { hasAction: () => true } },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('node-jobs-btn-assign')).toBeDisabled();
  },
};
