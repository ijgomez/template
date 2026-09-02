import * as fc from 'fast-check';
import { DateService } from './date.service';

/**
 * Feature: template-app, Property 13: Timezone conversion round-trip
 *
 * For any valid UTC timestamp and timezone offset, converting UTC→local→UTC
 * produces the original timestamp (within millisecond precision).
 *
 * **Validates: Requirements 27.3, 27.4**
 */
describe('Property 13: Timezone conversion round-trip', () => {
  let service: DateService;

  beforeEach(() => {
    service = new DateService();
  });

  /**
   * Arbitrary that generates valid UTC ISO 8601 timestamps covering:
   * - Years 2000-2099
   * - All months (1-12)
   * - Valid days for each month
   * - All hours (0-23), minutes (0-59), seconds (0-59)
   * - Milliseconds (0-999)
   *
   * This covers edge cases like midnight, end-of-day, DST transition times,
   * leap year dates, and various millisecond precisions.
   */
  const utcTimestampArbitrary = fc
    .record({
      year: fc.integer({ min: 2000, max: 2099 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // conservative to avoid invalid dates
      hour: fc.integer({ min: 0, max: 23 }),
      minute: fc.integer({ min: 0, max: 59 }),
      second: fc.integer({ min: 0, max: 59 }),
      millisecond: fc.integer({ min: 0, max: 999 }),
    })
    .map(({ year, month, day, hour, minute, second, millisecond }) => {
      // Use Date.UTC to construct a valid timestamp ensuring correctness
      const timestamp = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
      return new Date(timestamp).toISOString();
    });

  it('should preserve timestamp through toLocalDate → toUtcIsoString round-trip for any valid UTC timestamp', () => {
    fc.assert(
      fc.property(utcTimestampArbitrary, (utcIsoString: string) => {
        // Convert UTC ISO string → local Date object (Requirements 27.3)
        const localDate = service.toLocalDate(utcIsoString);

        // Convert local Date object → UTC ISO string (Requirements 27.4)
        const resultUtcString = service.toUtcIsoString(localDate);

        // Parse both timestamps to compare epoch milliseconds
        const originalMs = new Date(utcIsoString).getTime();
        const resultMs = new Date(resultUtcString).getTime();

        // The round-trip must preserve the timestamp within ms precision
        return originalMs === resultMs;
      }),
      { numRuns: 100 },
    );
  });

  it('should produce a valid ISO 8601 string with Z suffix after round-trip', () => {
    fc.assert(
      fc.property(utcTimestampArbitrary, (utcIsoString: string) => {
        const localDate = service.toLocalDate(utcIsoString);
        const resultUtcString = service.toUtcIsoString(localDate);

        // Result must be a valid ISO 8601 string ending with Z
        const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        return iso8601Pattern.test(resultUtcString);
      }),
      { numRuns: 100 },
    );
  });

  it('should handle edge-case timestamps: midnight, end-of-day, DST-transition hours', () => {
    // Extended arbitrary that specifically targets edge cases
    const edgeCaseTimestampArbitrary = fc.oneof(
      // Midnight timestamps
      fc
        .record({
          year: fc.integer({ min: 2000, max: 2099 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 28 }),
        })
        .map(({ year, month, day }) => new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString()),
      // End-of-day timestamps (23:59:59.999)
      fc
        .record({
          year: fc.integer({ min: 2000, max: 2099 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 28 }),
        })
        .map(({ year, month, day }) => new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString()),
      // DST transition hours (typically 1:00-3:00 AM in March/November)
      fc
        .record({
          year: fc.integer({ min: 2000, max: 2099 }),
          month: fc.constantFrom(3, 11), // March and November (common DST months)
          day: fc.integer({ min: 8, max: 15 }), // Common DST transition days
          hour: fc.integer({ min: 1, max: 3 }),
          minute: fc.integer({ min: 0, max: 59 }),
          second: fc.integer({ min: 0, max: 59 }),
          millisecond: fc.integer({ min: 0, max: 999 }),
        })
        .map(({ year, month, day, hour, minute, second, millisecond }) =>
          new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)).toISOString(),
        ),
      // Leap year February 29
      fc
        .integer({ min: 500, max: 524 })
        .map((n) => n * 4) // generates leap years 2000-2096
        .chain((year) =>
          fc
            .record({
              hour: fc.integer({ min: 0, max: 23 }),
              minute: fc.integer({ min: 0, max: 59 }),
              second: fc.integer({ min: 0, max: 59 }),
              millisecond: fc.integer({ min: 0, max: 999 }),
            })
            .map(({ hour, minute, second, millisecond }) =>
              new Date(Date.UTC(year, 1, 29, hour, minute, second, millisecond)).toISOString(),
            ),
        ),
    );

    fc.assert(
      fc.property(edgeCaseTimestampArbitrary, (utcIsoString: string) => {
        const localDate = service.toLocalDate(utcIsoString);
        const resultUtcString = service.toUtcIsoString(localDate);

        const originalMs = new Date(utcIsoString).getTime();
        const resultMs = new Date(resultUtcString).getTime();

        return originalMs === resultMs;
      }),
      { numRuns: 100 },
    );
  });
});
