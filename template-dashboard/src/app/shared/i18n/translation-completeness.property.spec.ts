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
   * Represents a path to a leaf value in the JSON tree.
   * Each element is one JSON key (which may contain dots).
   */
  type KeyPath = string[];

  /**
   * Recursively extracts all key paths from a nested JSON object.
   * Each path is an array of string keys (preserving literal dot characters in keys).
   */
  function extractKeyPaths(obj: Record<string, unknown>, prefix: KeyPath = []): KeyPath[] {
    const paths: KeyPath[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...prefix, key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        paths.push(...extractKeyPaths(value as Record<string, unknown>, currentPath));
      } else {
        paths.push(currentPath);
      }
    }
    return paths;
  }

  /**
   * Gets a nested value from an object using an array of keys (not dot-splitting).
   */
  function getByKeyPath(obj: Record<string, unknown>, path: KeyPath): unknown {
    let current: unknown = obj;
    for (const key of path) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  /**
   * Converts a key path to a display string (for error messages).
   */
  function pathToString(path: KeyPath): string {
    return path.join(' > ');
  }

  const enPaths = extractKeyPaths(enJson as Record<string, unknown>);
  const esPaths = extractKeyPaths(esJson as Record<string, unknown>);

  it('every key in en.json exists in es.json with non-empty value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...enPaths), (keyPath) => {
        const value = getByKeyPath(esJson as Record<string, unknown>, keyPath);
        expect(
          value,
          `Key "${pathToString(keyPath)}" exists in en.json but is missing in es.json`,
        ).toBeDefined();
        expect(
          typeof value === 'string' ? value.length > 0 : true,
          `Key "${pathToString(keyPath)}" has empty value in es.json`,
        ).toBe(true);
      }),
      { numRuns: enPaths.length },
    );
  });

  it('every key in es.json exists in en.json with non-empty value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...esPaths), (keyPath) => {
        const value = getByKeyPath(enJson as Record<string, unknown>, keyPath);
        expect(
          value,
          `Key "${pathToString(keyPath)}" exists in es.json but is missing in en.json`,
        ).toBeDefined();
        expect(
          typeof value === 'string' ? value.length > 0 : true,
          `Key "${pathToString(keyPath)}" has empty value in en.json`,
        ).toBe(true);
      }),
      { numRuns: esPaths.length },
    );
  });

  it('both locale files have the same set of keys', () => {
    const enKeyStrings = enPaths.map(pathToString).sort();
    const esKeyStrings = esPaths.map(pathToString).sort();

    const enSet = new Set(enKeyStrings);
    const esSet = new Set(esKeyStrings);

    const missingInEs = enKeyStrings.filter((k) => !esSet.has(k));
    const missingInEn = esKeyStrings.filter((k) => !enSet.has(k));

    expect(missingInEs, 'Keys present in en.json but missing in es.json').toEqual([]);
    expect(missingInEn, 'Keys present in es.json but missing in en.json').toEqual([]);
  });

  it('no key in any locale has an empty string value', () => {
    const allPaths = [...enPaths]; // Both files should have same keys
    fc.assert(
      fc.property(fc.constantFrom(...allPaths), (keyPath) => {
        const enValue = getByKeyPath(enJson as Record<string, unknown>, keyPath);
        const esValue = getByKeyPath(esJson as Record<string, unknown>, keyPath);

        if (typeof enValue === 'string') {
          expect(enValue.length, `en.json key "${pathToString(keyPath)}" is empty`).toBeGreaterThan(0);
        }
        if (typeof esValue === 'string') {
          expect(esValue.length, `es.json key "${pathToString(keyPath)}" is empty`).toBeGreaterThan(0);
        }
      }),
      { numRuns: allPaths.length },
    );
  });
});
