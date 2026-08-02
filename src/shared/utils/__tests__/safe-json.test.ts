import safeJSON from '../safe-json';

describe('safeJSON', () => {
  describe('stringify', () => {
    it('should stringify standard objects and primitives', () => {
      const obj = { a: 1, b: 'text', c: true, d: null, e: [1, 2] };
      expect(safeJSON.stringify(obj)).toBe(JSON.stringify(obj));
    });

    it('should convert bigint values to numbers when stringifying', () => {
      const obj = { amount: 1000n, nested: { count: 50n } };
      expect(safeJSON.stringify(obj)).toBe(
        '{"amount":1000,"nested":{"count":50}}'
      );
    });

    it('should apply custom replacer function if provided', () => {
      const obj = { a: 1, secret: 'hide', amount: 200n };
      const replacer = (key: string, value: unknown) =>
        key === 'secret' ? undefined : value;

      expect(safeJSON.stringify(obj, replacer)).toBe('{"a":1,"amount":200}');
    });

    it('should support space parameter for formatting', () => {
      const obj = { a: 1 };
      expect(safeJSON.stringify(obj, undefined, 2)).toBe('{\n  "a": 1\n}');
    });
  });

  describe('normalize', () => {
    it('should normalize objects by stringifying and parsing back', () => {
      const obj = {
        amount: 100n,
        name: 'test',
        date: new Date('2026-01-01T00:00:00.000Z'),
      };
      const normalized = safeJSON.normalize(obj);

      expect(normalized).toEqual({
        amount: 100,
        name: 'test',
        date: '2026-01-01T00:00:00.000Z',
      });
    });

    it('should return falsy/undefined output if stringify yields falsy result', () => {
      expect(safeJSON.normalize(undefined)).toBeUndefined();
    });

    it('should pass replacer and space arguments to stringify during normalize', () => {
      const obj = { a: 1, secret: 'omit' };
      const replacer = (key: string, value: unknown) =>
        key === 'secret' ? undefined : value;

      expect(safeJSON.normalize(obj, replacer)).toEqual({ a: 1 });
    });
  });

  describe('parse', () => {
    it('should parse valid JSON strings', () => {
      const jsonString = '{"a":1,"b":"hello"}';
      expect(safeJSON.parse(jsonString)).toEqual({ a: 1, b: 'hello' });
    });
  });
});
