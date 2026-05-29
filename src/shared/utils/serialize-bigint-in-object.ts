function serializeValue(
  value: unknown,
  seen: WeakMap<object, unknown>
): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date || value instanceof RegExp) {
    return value;
  }

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    result.length = value.length;
    seen.set(value, result);

    value.forEach((item, index) => {
      result[index] = serializeValue(item, seen);
    });

    return result;
  }

  const result: Record<PropertyKey, unknown> = {};
  seen.set(value, result);

  const keys = [
    ...Object.keys(value),
    ...Object.getOwnPropertySymbols(value).filter(
      (key) => Object.getOwnPropertyDescriptor(value, key)?.enumerable
    ),
  ];

  keys.forEach((key) => {
    result[key] = serializeValue(
      (value as Record<PropertyKey, unknown>)[key],
      seen
    );
  });

  return result;
}

export default function serializeBigIntInObj<T>(payload: T): T;
export default function serializeBigIntInObj(payload: unknown) {
  return serializeValue(payload, new WeakMap());
}
