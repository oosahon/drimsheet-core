import batchArray from '@shared/utils/batch-array';

describe('batchArray', () => {
  it('splits an array into batches of the requested size', () => {
    expect(batchArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns equal-sized batches when the array divides evenly', () => {
    expect(batchArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('returns the entire array as one batch when the batch size is larger', () => {
    expect(batchArray(['asset', 'liability'], 5)).toEqual([
      ['asset', 'liability'],
    ]);
  });

  it('returns an empty array when given an empty array', () => {
    expect(batchArray([], 3)).toEqual([]);
  });

  it('supports arrays of objects without mutating the input', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    const third = { id: 3 };
    const input = [first, second, third];

    const batches = batchArray(input, 2);

    expect(batches).toEqual([[first, second], [third]]);
    expect(input).toEqual([first, second, third]);
    expect(batches[0]).not.toBe(input);
  });
});
