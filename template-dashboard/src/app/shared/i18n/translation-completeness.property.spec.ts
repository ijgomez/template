import * as fc from 'fast-check';
import enJson from '../../../assets/i18n/en.json';
import esJson from '../../../assets/i18n/es.json';

/**
 * Property-based test for translation key completeness.
 *
 * **Validates: Requirements 12.1**
 *
 * Property 15: Translation key completeness.
 * For any translation key present in one locale file,
 * that key must exist in all other locale files with a non-empty value.
 */
describe('Translation Key Completeness - Property 15', () => {
  /**
   * Recursively extracts all dot-notation keys from a nested JSON object.
   */
  function extractKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  /**
   * Gets a nested value from an object using dot notation.
   */
  function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  const enKeys = extractKeys(enJson as Record<string, unknown>);
  const esKeys = extractKeys(esJson as Record<string, unknown>);
  const allKeys = [...new Set([...enKeys, ...esKeys])];

  it('every key in en.json exists in es.json with non-empty value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...enKeys), (key) => {
        const value = getNestedValue(esJson as Record<string, unknown>, key);
        expect(value).withContext(
          `Key "${key}" exists in en.json but is missing or empty in es.json`,
        ).toBeDefined();
        expect(typeof value === 'string' ? value.length > 0 : true).withContext(
          `Key "${key}" has empty value in es.json`,
        ).toBe(true);
      }),
      { numRuns: enKeys.length },
    );
  });

  it('every key in es.json exists in en.json with non-empty value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...esKeys), (key) => {
        const value = getNestedValue(enJson as Record<string, unknown>, key);
        expect(value).withContext(
          `Key "${key}" exists in es.json but is missing or empty in en.json`,
        ).toBeDefined();
        expect(typeof value === 'string' ? value.length > 0 : true).withContext(
          `Key "${key}" has empty value in en.json`,
        ).toBe(true);
      }),
      { numRuns: esKeys.length },
    );
  });

  it('both locale files have the same set of keys', () => {
    const enSet = new Set(enKeys);
    const esSet = new Set(esKeys);

    const missingInEs = enKeys.filter((k) => !esSet.has(k));
    const missingInEn = esKeys.filter((k) => !enSet.has(k));

    expect(missingInEs).withContext('Keys present in en.json but missing in es.json').toEqual([]);
    expect(missingInEn).withContext('Keys present in es.json but missing in en.json').toEqual([]);
  });

  it('no key in any locale has an empty string value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allKeys), (key) => {
        const enValue = getNestedValue(enJson as Record<string, unknown>, key);
        const esValue = getNestedValue(esJson as Record<string, unknown>, key);

        if (typeof enValue === 'string') {
          expect(enValue.length).withContext(`en.json key "${key}" is empty`).toBeGreaterThan(0);
        }
        if (typeof esValue === 'string') {
          expect(esValue.length).withContext(`es.json key "${key}" is empty`).toBeGreaterThan(0);
        }
      }),
      { numRuns: allKeys.length },
    );
  });
});
