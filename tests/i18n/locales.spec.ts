// tests/i18n/locales.spec.ts
import { describe, test, expect } from 'vitest';
import en from '@/locales/en.json';
import he from '@/locales/he.json';

describe('Localization Files', () => {
  const enKeys = Object.keys(en);
  const heKeys = Object.keys(he);

  test('should have the same number of keys', () => {
    expect(enKeys.length).toEqual(heKeys.length);
  });

  test('should have the same set of keys', () => {
    const enKeySet = new Set(enKeys);
    const heKeySet = new Set(heKeys);

    // Find keys missing in Hebrew
    const missingInHe = enKeys.filter(key => !heKeySet.has(key));
    expect(missingInHe, `Keys missing in he.json: ${missingInHe.join(', ')}`).toEqual([]);

    // Find keys missing in English
    const missingInEn = heKeys.filter(key => !enKeySet.has(key));
    expect(missingInEn, `Keys missing in en.json: ${missingInEn.join(', ')}`).toEqual([]);
  });

  test('should not have empty values in en.json', () => {
    for (const key of enKeys) {
      // @ts-ignore
      const value = en[key];
      // Allow for nested objects (like pricing_tiers) which are not simple strings
      if (typeof value === 'string') {
        expect(value.trim(), `Key "${key}" in en.json has an empty value.`).not.toBe('');
      }
    }
  });

  test('should not have empty values in he.json', () => {
    for (const key of heKeys) {
      // @ts-ignore
      const value = he[key];
      if (typeof value === 'string') {
          expect(value.trim(), `Key "${key}" in he.json has an empty value.`).not.toBe('');
      }
    }
  });
});
