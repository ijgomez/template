import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { BehaviorSubject } from 'rxjs';
import { expect, within, userEvent } from 'storybook/test';

import { NotificationComponent } from './notification.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

/**
 * Crea un stub de NotificationService con una lista fija de notificaciones.
 * Evita los timers de auto-dismiss del servicio real para tener historias
 * deterministas. `dismiss` actualiza el stream para poder probar la interacción.
 */
function stubNotificationService(initial: Notification[]) {
  const subject = new BehaviorSubject<Notification[]>(initial);
  return {
    notifications$: subject.asObservable(),
    dismiss: (id: string) => subject.next(subject.getValue().filter(n => n.id !== id)),
  } as Partial<NotificationService>;
}

function notification(partial: Partial<Notification> & Pick<Notification, 'type' | 'messageKey'>): Notification {
  return { id: partial.messageKey, createdAt: 0, ...partial };
}

/**
 * Contenedor de toasts para notificaciones de progreso y éxito. Las de tipo
 * error se muestran en `ErrorDialogComponent`, no aquí.
 */
const meta: Meta<NotificationComponent> = {
  title: 'Shared/Notification',
  component: NotificationComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<NotificationComponent>;

/**
 * Notificación de progreso: muestra el spinner y no se auto-descarta.
 */
export const Progress: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([
            notification({ id: 'ntf-1', type: 'progress', messageKey: 'notification.progress' }),
          ]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('notification-progress')).toBeInTheDocument();
    await expect(canvas.getByTestId('notification-spinner')).toBeInTheDocument();
  },
};

/**
 * Notificación de éxito: muestra el icono de check.
 */
export const Success: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([
            notification({ id: 'ntf-2', type: 'success', messageKey: 'notification.success' }),
          ]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('notification-success')).toBeInTheDocument();
  },
};

/**
 * Varias notificaciones simultáneas y descarte por clic en el botón de cierre.
 */
export const MultipleAndDismiss: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationService,
          useValue: stubNotificationService([
            notification({ id: 'ntf-3', type: 'progress', messageKey: 'notification.progress' }),
            notification({ id: 'ntf-4', type: 'success', messageKey: 'notification.success' }),
          ]),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('notification-container')).toBeInTheDocument();
    const dismissButtons = canvas.getAllByTestId('notification-dismiss');
    await expect(dismissButtons).toHaveLength(2);
    // Descarta la primera notificación; debe quedar una sola.
    await userEvent.click(dismissButtons[0]);
    await expect(canvas.getAllByTestId('notification-dismiss')).toHaveLength(1);
  },
};

/**
 * Sin notificaciones: no se renderiza el contenedor.
 */
export const Empty: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: NotificationService, useValue: stubNotificationService([]) }],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('notification-container')).not.toBeInTheDocument();
  },
};
