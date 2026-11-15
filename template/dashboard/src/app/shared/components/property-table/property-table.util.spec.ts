import * as fc from 'fast-check';
import { PropertyRow, filterRows, toSortedRows } from './property-table.util';

const NUM_RUNS = 100;

/**
 * Feature: cluster-node-extended-info, Property 12: Orden y filtro de propiedades
 *
 * **Validates: Requirements 7.3, 7.4**
 */
describe('Property 12: Orden y filtro de propiedades', () => {
  const propsArb = fc.dictionary(fc.string({ maxLength: 12 }), fc.string({ maxLength: 12 }));
  const rowsArb = propsArb.map((props) => toSortedRows(props));

  it('toSortedRows returns every entry sorted ascending by key, case-insensitive', () => {
    fc.assert(
      fc.property(propsArb, (props) => {
        const rows = toSortedRows(props);

        expect(rows.length).toBe(Object.keys(props).length);
        for (const row of rows) {
          expect(props[row.key]).toBe(row.value);
        }
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1].key.toLowerCase();
          const curr = rows[i].key.toLowerCase();
          expect(prev.localeCompare(curr, undefined, { sensitivity: 'base' })).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('filterRows returns exactly the rows whose key or value contains the text, keeping order', () => {
    fc.assert(
      fc.property(rowsArb, fc.string({ maxLength: 4 }), (rows: PropertyRow[], text) => {
        const needle = text.toLowerCase();
        const expected = rows.filter(
          (r) => r.key.toLowerCase().includes(needle) || r.value.toLowerCase().includes(needle),
        );

        const result = filterRows(rows, text);

        expect(result).toEqual(expected);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('filterRows does not modify the input rows (other section is unaffected)', () => {
    fc.assert(
      fc.property(rowsArb, fc.string({ maxLength: 4 }), (rows: PropertyRow[], text) => {
        const snapshot = rows.map((r) => ({ ...r }));

        filterRows(rows, text);

        expect(rows).toEqual(snapshot);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
