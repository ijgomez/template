/**
 * Notification types supported by the notification system.
 */
export type NotificationType = 'progress' | 'success' | 'error';

/**
 * Represents a single notification displayed to the user.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  messageKey: string;
  createdAt: number;
}
