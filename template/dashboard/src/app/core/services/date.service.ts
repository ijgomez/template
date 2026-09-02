import { Injectable } from '@angular/core';

/**
 * Centralized service for timezone conversion between UTC (backend) and local user timezone.
 * All timestamps from the backend arrive as ISO 8601 strings with Z suffix (UTC).
 * This service converts them for display in the user's local timezone and
 * converts back to UTC before sending to the backend.
 */
@Injectable({ providedIn: 'root' })
export class DateService {
  /**
   * Returns the user's local timezone identifier (e.g. 'Europe/Madrid').
   */
  getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Parses a UTC ISO string (e.g. '2024-01-15T10:30:00Z') into a local Date object.
   */
  toLocalDate(utcIsoString: string): Date {
    return new Date(utcIsoString);
  }

  /**
   * Formats a UTC ISO string into a localized display string.
   * @param utcIsoString - ISO 8601 string with Z suffix
   * @param format - Optional format: 'full' (date + time), 'date' (date only), 'time' (time only)
   */
  toLocalString(utcIsoString: string, format: 'full' | 'date' | 'time' = 'full'): string {
    const date = new Date(utcIsoString);
    const timezone = this.getUserTimezone();

    switch (format) {
      case 'date':
        return date.toLocaleDateString(undefined, { timeZone: timezone });
      case 'time':
        return date.toLocaleTimeString(undefined, { timeZone: timezone });
      default:
        return date.toLocaleString(undefined, { timeZone: timezone });
    }
  }

  /**
   * Converts a local Date object to a UTC ISO 8601 string with Z suffix
   * suitable for sending to the backend.
   */
  toUtcIsoString(localDate: Date): string {
    return localDate.toISOString();
  }

  /**
   * Formats a UTC ISO string into a localized date-time string for display.
   * Example output: '15/01/2024, 11:30:00' (depending on locale)
   */
  formatDateTime(utcIsoString: string): string {
    return this.toLocalString(utcIsoString, 'full');
  }

  /**
   * Formats a UTC ISO string into a localized date-only string for display.
   * Example output: '15/01/2024' (depending on locale)
   */
  formatDate(utcIsoString: string): string {
    return this.toLocalString(utcIsoString, 'date');
  }

  /**
   * Formats a UTC ISO string into a localized time-only string for display.
   * Example output: '11:30:00' (depending on locale)
   */
  formatTime(utcIsoString: string): string {
    return this.toLocalString(utcIsoString, 'time');
  }
}
