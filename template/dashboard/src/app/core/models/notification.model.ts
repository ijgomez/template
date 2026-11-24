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
  message?: string;
  /** Interpolation parameters for the translated messageKey (e.g. {{status}}). */
  messageParams?: Record<string, unknown>;
  createdAt: number;
}
