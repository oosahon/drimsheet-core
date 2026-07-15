const safeJSON = {
  stringify: (
    value: any,
    replacer?: (this: any, key: string, value: any) => any,
    space?: string | number
  ): string => {
    return JSON.stringify(
      value,
      (key, val) => {
        const processedVal = typeof val === 'bigint' ? Number(val) : val;
        return replacer ? replacer(key, processedVal) : processedVal;
      },
      space
    );
  },
  parse: JSON.parse,
};

export default safeJSON;
