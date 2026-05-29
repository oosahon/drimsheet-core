import serializeBigIntInObj from '../serialize-bigint-in-object';

describe('serializeBigIntInObj', () => {
  it('serializes bigint values in nested objects', () => {
    const payload = {
      id: 1n,
      name: 'ledger',
      meta: {
        amount: 2500n,
      },
    };

    expect(serializeBigIntInObj(payload)).toEqual({
      id: 1,
      name: 'ledger',
      meta: {
        amount: 2500,
      },
    });
  });

  it('serializes bigint values in arrays', () => {
    expect(serializeBigIntInObj([1n, { amount: 20n }, [30n]])).toEqual([
      1,
      { amount: 20 },
      [30],
    ]);
  });

  it('preserves sparse array length', () => {
    const payload = new Array(3);
    payload[1] = 10n;

    const result = serializeBigIntInObj(payload);

    expect(result).toHaveLength(3);
    expect(0 in result).toBe(false);
    expect(result[1]).toBe(10);
  });

  it('leaves non-bigint primitive values unchanged', () => {
    expect(serializeBigIntInObj(null)).toBeNull();
    expect(serializeBigIntInObj(undefined)).toBeUndefined();
    expect(serializeBigIntInObj('value')).toBe('value');
    expect(serializeBigIntInObj(12)).toBe(12);
    expect(serializeBigIntInObj(false)).toBe(false);
  });

  it('does not mutate the original payload', () => {
    const payload = {
      amount: 100n,
      nested: {
        values: [200n],
      },
    };

    const result = serializeBigIntInObj(payload);

    expect(result).toEqual({
      amount: 100,
      nested: {
        values: [200],
      },
    });
    expect(payload.amount).toBe(100n);
    expect(payload.nested.values[0]).toBe(200n);
  });

  it('preserves circular references', () => {
    const payload: {
      amount: bigint;
      self?: unknown;
    } = {
      amount: 100n,
    };
    payload.self = payload;

    const result = serializeBigIntInObj(payload);

    expect(result.amount).toBe(100);
    expect(result.self).toBe(result);
  });
});
