import {isShoppingBackup} from './ShoppingBackup';

describe('isShoppingBackup', () => {
  it('accepts a version 1 backup', () => {
    expect(isShoppingBackup({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      shopping: [],
      items: [],
    })).toBe(true);
  });

  it('rejects invalid payloads', () => {
    expect(isShoppingBackup(null)).toBe(false);
    expect(isShoppingBackup({ version: 2, shopping: [], items: [] })).toBe(false);
    expect(isShoppingBackup({ version: 1, shopping: [] })).toBe(false);
  });
});
