import { describe, expect, test } from 'bun:test';
import { isLanguage, LANGUAGES } from '../languages';

describe('isLanguage', () => {
  test('returns true for "javascript"', () => {
    expect(isLanguage('javascript')).toBe(true);
  });

  test('returns true for "plaintext"', () => {
    expect(isLanguage('plaintext')).toBe(true);
  });

  test('returns false for unknown language', () => {
    expect(isLanguage('notareal')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isLanguage('')).toBe(false);
  });

  test('returns false for non-string value', () => {
    // @ts-expect-error testing wrong type
    expect(isLanguage(123)).toBe(false);
  });
});

describe('LANGUAGES', () => {
  test('is a non-empty readonly array', () => {
    expect(Array.isArray(LANGUAGES)).toBe(true);
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  test('all values in LANGUAGES pass isLanguage()', () => {
    for (const lang of LANGUAGES) {
      expect(isLanguage(lang)).toBe(true);
    }
  });
});
