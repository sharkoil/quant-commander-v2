import { inferredType, isLikelyDate } from './page';

describe('inferredType', () => {
  it('should correctly infer number type', () => {
    expect(inferredType('123')).toBe('number');
    expect(inferredType('$123.45')).toBe('number');
    expect(inferredType('-10')).toBe('number');
  });

  it('should correctly infer boolean type', () => {
    expect(inferredType('true')).toBe('boolean');
    expect(inferredType('FALSE')).toBe('boolean');
  });

  it('should correctly infer date type', () => {
    expect(inferredType('2023-01-15')).toBe('date');
    expect(inferredType('01/15/2023')).toBe('date');
  });

  it('should default to string type', () => {
    expect(inferredType('hello')).toBe('string');
    expect(inferredType('123 Main St')).toBe('string');
  });
});

describe('isLikelyDate', () => {
  it('should return true for valid date strings', () => {
    expect(isLikelyDate('2023-01-15')).toBe(true);
    expect(isLikelyDate('01/15/2023')).toBe(true);
    expect(isLikelyDate('15-01-2023')).toBe(true);
  });

  it('should return false for invalid date strings', () => {
    expect(isLikelyDate('not a date')).toBe(false);
    expect(isLikelyDate('2023-13-01')).toBe(false); // Invalid month
    expect(isLikelyDate('2023-01-32')).toBe(false); // Invalid day
  });
});