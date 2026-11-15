import * as fc from 'fast-check';
import {
  BYTES_PER_GB,
  NO_VALUE,
  formatFreePercent,
  formatGb,
  formatInteger,
} from './format.util';

const NUM_RUNS = 100;

/**
 * Feature: cluster-node-extended-info, Property 11: Formato de espacio y porcentaje en el formulario
 *
 * **Validates: Requirements 7.2, 7.6**
 */
describe('Property 11: Formato de espacio y porcentaje en el formulario', () => {
  const totalAndFree = fc
    .integer({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .chain((total) => fc.tuple(fc.constant(total), fc.integer({ min: 0, max: total })));

  it('formatGb returns total / 1073741824 with exactly two decimals', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }), (total) => {
        const result = formatGb(total);
        expect(result).toMatch(/^\d+\.\d{2}$/);
        expect(result).toBe((total / BYTES_PER_GB).toFixed(2));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('formatFreePercent returns one decimal within [0.0, 100.0]', () => {
    fc.assert(
      fc.property(totalAndFree, ([total, free]) => {
        const result = formatFreePercent(total, free);
        expect(result).toMatch(/^\d+\.\d$/);
        const value = Number(result);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('returns "-" for null values and for a null or zero total', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<number | null | undefined>(null, undefined),
        fc.option(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), { nil: null }),
        (nil, free) => {
          expect(formatGb(nil)).toBe(NO_VALUE);
          expect(formatInteger(nil)).toBe(NO_VALUE);
          expect(formatFreePercent(nil, free)).toBe(NO_VALUE);
          expect(formatFreePercent(0, free)).toBe(NO_VALUE);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
