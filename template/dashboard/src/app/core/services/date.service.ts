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
      default: {
        // Combine date and time with a space instead of the locale-inserted comma.
        const datePart = date.toLocaleDateString(undefined, { timeZone: timezone });
        const timePart = date.toLocaleTimeString(undefined, { timeZone: timezone });
        return `${datePart} ${timePart}`;
      }
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
   * Converts a local calendar day ('YYYY-MM-DD', as emitted by `<input type="date">`) into the
   * UTC instant of its start (00:00 in the browser time zone).
   * Use it as the inclusive lower bound of a date-range filter.
   * Example (Europe/Madrid): '2026-10-25' → '2026-10-24T22:00:00.000Z'.
   */
  toUtcStartOfLocalDay(localDay: string, timeZone: string = this.getUserTimezone()): string {
    return this.zonedMidnightToUtc(localDay, 0, timeZone).toISOString();
  }

  /**
   * Converts a local calendar day ('YYYY-MM-DD') into the UTC instant of the start of the
   * following local day. Use it as the exclusive upper bound of a date-range filter, so that
   * days of 23 or 25 hours (DST changes) are covered exactly.
   * Example (Europe/Madrid): '2026-10-25' → '2026-10-25T23:00:00.000Z'.
   */
  toUtcStartOfNextLocalDay(localDay: string, timeZone: string = this.getUserTimezone()): string {
    return this.zonedMidnightToUtc(localDay, 1, timeZone).toISOString();
  }

  /**
   * Returns the UTC instant of 00:00 of the given 'YYYY-MM-DD' day (plus `dayOffset` days)
   * in the given IANA time zone. The zone offset is resolved with Intl, so DST is honoured.
   */
  private zonedMidnightToUtc(localDay: string, dayOffset: number, timeZone: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
    if (!match) {
      throw new Error(`Invalid local day, expected YYYY-MM-DD: ${localDay}`);
    }
    const [, year, month, day] = match;
    // Wall-clock midnight expressed as if it were UTC (Date.UTC normalises day overflow).
    const wallClockAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day) + dayOffset);
    // Two passes: the offset at the first guess may differ from the offset at the real instant.
    let instant = wallClockAsUtc - this.timeZoneOffsetMs(wallClockAsUtc, timeZone);
    instant = wallClockAsUtc - this.timeZoneOffsetMs(instant, timeZone);
    return new Date(instant);
  }

  /** Offset (ms) of `timeZone` with respect to UTC at the given instant (e.g. +7200000 for CEST). */
  private timeZoneOffsetMs(instant: number, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(instant));
    const value = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((part) => part.type === type)?.value);
    const wallClockAsUtc = Date.UTC(
      value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'),
    );
    return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
  }

  /**
   * Formats a UTC ISO string into a localized date-time string for display.
   * Example output: '15/01/2024 11:30:00' (depending on locale)
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
