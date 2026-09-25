import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { BehaviorSubject } from 'rxjs';
import { expect, within, userEvent } from 'storybook/test';

import { ErrorDialogComponent } from './error-dialog.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

/**
 * Crea un stub de NotificationService con una lista fija de notificaciones.
 * `dismiss` actualiza el stream para poder probar el cierre del modal.
 */
function stubNotificationService(initial: Notification[]) {
  const subject = new BehaviorSubject<Notification[]>(initial);
  return {
    notifications$: subject.asObservable(),
    dismiss: (id: string) => subject.next(subject.getValue().filter(n => n.id !== id)),
  } as Partial<NotificationService>;
}

function errorNotification(id: string, extra: Partial<Notification> = {}): Notification {
  return { id, type: 'error', messageKey: 'error.generic', createdAt: 0, ...extra };
}

/**
 * Modal de error. Se muestra cuando hay notificaciones de tipo `error` en el
 * `NotificationService`. No se auto-descarta: el usuario debe aceptarlo.
 */
const meta: Meta<ErrorDialogComponent> = {
  title: 'Shared/ErrorDialog',
  component: ErrorDialogComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ErrorDialogComponent>;

/**
 * Error con clave de traducción (sin mensaje literal del backend).
 */
export const WithMessageKey: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([errorNotification('err-1', { messageKey: 'error.forbidden' })]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('error-dialog')).toBeInTheDocument();
    await expect(canvas.getByTestId('error-message-err-1')).toBeInTheDocument();
  },
};

/**
 * Error con mensaje literal recibido del backend.
 */
export const WithBackendMessage: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([
            errorNotification('err-2', { message: 'Connection refused (ECONNREFUSED)' }),
          ]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection refused (ECONNREFUSED)')).toBeInTheDocument();
  },
};

/**
 * Varios errores mostrados a la vez y cierre mediante el botón Aceptar.
 */
export const MultipleAndDismiss: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([
            errorNotification('err-3', { message: 'First error' }),
            errorNotification('err-4', { message: 'Second error' }),
          ]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('error-message-err-3')).toBeInTheDocument();
    await expect(canvas.getByTestId('error-message-err-4')).toBeInTheDocument();
    // Aceptar descarta todos los errores y cierra el modal.
    await userEvent.click(canvas.getByTestId('error-dialog-accept'));
    await expect(canvas.queryByTestId('error-dialog')).not.toBeInTheDocument();
  },
};

/**
 * Sin errores: el modal no se renderiza.
 */
export const Empty: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: NotificationService, useValue: stubNotificationService([]) }],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('error-dialog')).not.toBeInTheDocument();
  },
};
