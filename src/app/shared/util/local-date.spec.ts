import {formatShoppingDate, parseLocalDate, toLocalDateInput} from './local-date';

describe('local-date', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    const date = parseLocalDate('2026-08-30');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(30);
  });

  it('keeps UTC-midnight dates on the original calendar day', () => {
    expect(toLocalDateInput(new Date('2026-03-15T00:00:00.000Z'))).toBe('2026-03-15');
  });

  it('formats shopping dates as dd/MM/yyyy', () => {
    expect(formatShoppingDate(new Date('2026-03-15T00:00:00.000Z'))).toBe('15/03/2026');
  });

  it('parses a date string in toLocalDateInput', () => {
    expect(toLocalDateInput('2026-08-01T15:30:00')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns empty values for invalid dates', () => {
    expect(toLocalDateInput('not-a-date')).toBe('');
    expect(formatShoppingDate('not-a-date')).toBe('');
  });

  it('uses local calendar parts when the instant is not UTC midnight', () => {
    const date = new Date(2026, 7, 30, 15, 0, 0);
    expect(toLocalDateInput(date)).toBe('2026-08-30');
    expect(formatShoppingDate(date)).toBe('30/08/2026');
  });
});
