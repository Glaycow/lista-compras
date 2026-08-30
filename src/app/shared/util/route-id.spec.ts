import {parseRouteId} from './route-id';

describe('parseRouteId', () => {
  it('parses a positive numeric string', () => {
    expect(parseRouteId('12')).toBe(12);
  });

  it('returns null for missing or invalid values', () => {
    expect(parseRouteId(null)).toBeNull();
    expect(parseRouteId('')).toBeNull();
    expect(parseRouteId('abc')).toBeNull();
    expect(parseRouteId('0')).toBeNull();
    expect(parseRouteId('-1')).toBeNull();
  });
});
