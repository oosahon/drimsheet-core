function stringify(
  value: any,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
): string {
  return JSON.stringify(
    value,
    (key, val) => {
      const processedVal = typeof val === 'bigint' ? Number(val) : val;
      return replacer ? replacer(key, processedVal) : processedVal;
    },
    space
  );
}

function normalize(
  value: any,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
) {
  const stringValue = stringify(value, replacer, space);
  return stringValue ? JSON.parse(stringValue) : stringValue;
}

const safeJSON = Object.freeze({
  stringify,
  normalize,
  parse: JSON.parse,
});

export default safeJSON;
