import generateDiff from '../diff-generator';

describe('generateDiff', () => {
  it('should return empty objects if identical', () => {
    const diff = generateDiff({ a: 1 }, { a: 1 });
    expect(diff.before).toEqual({});
    expect(diff.after).toEqual({});
  });

  it('should treat missing before as full creation', () => {
    const diff = generateDiff({ a: 1 });
    expect(diff.before).toEqual({});
    expect(diff.after).toEqual({ a: 1 });
  });

  it('should deeply diff nested objects', () => {
    const diff = generateDiff(
      { a: 1, b: { c: 2, d: 4 }, e: 5 },
      { a: 1, b: { c: 2, d: 3 } }
    );
    expect(diff.before).toEqual({ b: { d: 3 }, e: undefined });
    expect(diff.after).toEqual({ b: { d: 4 }, e: 5 });
  });

  it('should deeply diff arrays', () => {
    const diff = generateDiff({ a: [1, 2, 4] }, { a: [1, 2, 3] });
    const expectedBeforeArray: unknown[] = [];
    expectedBeforeArray[2] = 3;
    const expectedAfterArray: unknown[] = [];
    expectedAfterArray[2] = 4;

    expect(diff.before).toEqual({ a: expectedBeforeArray });
    expect(diff.after).toEqual({ a: expectedAfterArray });
  });

  it('should handle dates correctly', () => {
    const date1 = new Date('2026-01-01');
    const date2 = new Date('2026-01-02');

    const diff1 = generateDiff({ d: date1 }, { d: date1 });
    expect(diff1.before).toEqual({});
    expect(diff1.after).toEqual({});

    const diff2 = generateDiff({ d: date2 }, { d: date1 });
    expect(diff2.before).toEqual({ d: date1 });
    expect(diff2.after).toEqual({ d: date2 });
  });

  it('should return top level field deletions properly', () => {
    const diff = generateDiff({ a: 1 }, { a: 1, b: 2 });
    expect(diff.before).toEqual({ b: 2 });
    expect(diff.after).toEqual({ b: undefined });
  });

  it('should handle type mismatches wholesale (object to primitive, etc)', () => {
    const diff = generateDiff<{ a: unknown }>(
      { a: 1 },
      { a: { complex: true } }
    );
    expect(diff.before).toEqual({ a: { complex: true } });
    expect(diff.after).toEqual({ a: 1 });
  });

  it('should handle array extensions', () => {
    const diff = generateDiff({ a: [1, 2] }, { a: [1] });
    const expectedBeforeArray: unknown[] = [];
    expectedBeforeArray[1] = undefined;
    const expectedAfterArray: unknown[] = [];
    expectedAfterArray[1] = 2;

    expect(diff.before).toEqual({ a: expectedBeforeArray });
    expect(diff.after).toEqual({ a: expectedAfterArray });
  });
});
