const { isValidTitle, normalizeTitle, parseId } = require('../validation');

describe('isValidTitle', () => {
  test('accepts a normal title', () => {
    expect(isValidTitle('Buy groceries')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(isValidTitle('')).toBe(false);
  });

  test('rejects whitespace-only strings', () => {
    expect(isValidTitle('   ')).toBe(false);
  });

  test('rejects non-string values', () => {
    expect(isValidTitle(null)).toBe(false);
    expect(isValidTitle(undefined)).toBe(false);
    expect(isValidTitle(123)).toBe(false);
    expect(isValidTitle({})).toBe(false);
  });

  test('rejects titles longer than 200 characters', () => {
    expect(isValidTitle('a'.repeat(201))).toBe(false);
  });

  test('accepts titles exactly 200 characters', () => {
    expect(isValidTitle('a'.repeat(200))).toBe(true);
  });
});

describe('normalizeTitle', () => {
  test('trims surrounding whitespace', () => {
    expect(normalizeTitle('   hello   ')).toBe('hello');
  });

  test('returns empty string for non-string input', () => {
    expect(normalizeTitle(null)).toBe('');
    expect(normalizeTitle(undefined)).toBe('');
  });
});

describe('parseId', () => {
  test('parses a valid numeric string', () => {
    expect(parseId('42')).toBe(42);
  });

  test('returns null for non-numeric input', () => {
    expect(parseId('abc')).toBeNull();
  });

  test('returns null for zero or negative IDs', () => {
    expect(parseId('0')).toBeNull();
    expect(parseId('-5')).toBeNull();
  });
});
