import generateDiff from '@shared/utils/diff-generator';

describe('generateDiff', () => {
  it('should return full snapshots if identical', () => {
    const before = { a: 1 };
    const after = { a: 1 };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(false);
  });

  it('should return full snapshots if identical arrays are provided', () => {
    const before = { a: [1, 2, 3] };
    const after = { a: [1, 2, 3] };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(false);
  });

  it('should treat missing before as full creation', () => {
    const diff = generateDiff({ a: 1 });
    expect(diff.before).toBeNull();
    expect(diff.after).toEqual({ a: 1 });
    expect(diff.hasChanges).toBe(true);
  });

  it('should detect changes in deeply nested objects', () => {
    const before = { a: 1, b: { c: 2, d: 3 } };
    const after = { a: 1, b: { c: 2, d: 4 }, e: 5 };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(true);
  });

  it('should detect changes in arrays', () => {
    const before = { a: [1, 2, 3] };
    const after = { a: [1, 2, 4] };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(true);
  });

  it('should handle dates correctly', () => {
    const date1 = new Date('2026-01-01');
    const date2 = new Date('2026-01-02');

    const diff1 = generateDiff({ d: date1 }, { d: date1 });
    expect(diff1.before).toEqual({ d: date1 });
    expect(diff1.after).toEqual({ d: date1 });

    const diffSameTime = generateDiff(
      { d: new Date('2026-01-01') },
      { d: new Date('2026-01-01') }
    );
    expect(diffSameTime.hasChanges).toBe(false);

    const diff2 = generateDiff({ d: date2 }, { d: date1 });
    expect(diff2.before).toEqual({ d: date1 });
    expect(diff2.after).toEqual({ d: date2 });
    expect(diff2.hasChanges).toBe(true);
  });

  it('should return top level field deletions properly', () => {
    const before = { a: 1, b: 2 };
    const after = { a: 1 };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(true);
  });

  it('should handle type mismatches wholesale (object to primitive, etc)', () => {
    const diff = generateDiff<{ a: unknown }>(
      { a: 1 },
      { a: { complex: true } }
    );
    expect(diff.before).toEqual({ a: { complex: true } });
    expect(diff.after).toEqual({ a: 1 });
    expect(diff.hasChanges).toBe(true);
  });

  it('should handle array extensions', () => {
    const before = { a: [1] };
    const after = { a: [1, 2] };
    const diff = generateDiff(after, before);
    expect(diff.before).toEqual(before);
    expect(diff.after).toEqual(after);
    expect(diff.hasChanges).toBe(true);
  });
});
