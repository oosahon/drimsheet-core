import cacheStorage from '../cache-storage.impl';

const mockRedis = {
  set: jest.fn(),
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  eval: jest.fn(),
};

jest.mock('../../../config/redis.config', () => ({
  getRedis: () => mockRedis,
}));

describe('cacheStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('sets a value with TTL using setex', async () => {
      mockRedis.setex.mockResolvedValue('OK');
      await cacheStorage.set('my-key', { foo: 'bar' }, 60);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'my-key',
        60,
        JSON.stringify({ foo: 'bar' })
      );
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('sets a value without TTL using set', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await cacheStorage.set('my-key', { foo: 'bar' });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'my-key',
        JSON.stringify({ foo: 'bar' })
      );
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });
  });

  describe('setIfNotExists', () => {
    it('returns true when set NX EX succeeds', async () => {
      mockRedis.set.mockResolvedValue('OK');
      const result = await cacheStorage.setIfNotExists('my-key', 'value', 30);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'my-key',
        JSON.stringify('value'),
        'EX',
        30,
        'NX'
      );
      expect(result).toBe(true);
    });

    it('returns false when set NX EX fails', async () => {
      mockRedis.set.mockResolvedValue(null);
      const result = await cacheStorage.setIfNotExists('my-key', 'value', 30);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'my-key',
        JSON.stringify('value'),
        'EX',
        30,
        'NX'
      );
      expect(result).toBe(false);
    });
  });

  describe('deleteIfValueMatches', () => {
    it('runs Lua script to delete matching value and returns true if deleted', async () => {
      mockRedis.eval.mockResolvedValue(1);
      const result = await cacheStorage.deleteIfValueMatches('key1', 'val', [
        'key2',
        'key3',
      ]);

      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        3,
        'key1',
        'key2',
        'key3',
        JSON.stringify('val')
      );
      expect(result).toBe(true);
    });

    it('returns false if Lua script deletes 0 keys', async () => {
      mockRedis.eval.mockResolvedValue(0);
      const result = await cacheStorage.deleteIfValueMatches('key1', 'val');

      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'key1',
        JSON.stringify('val')
      );
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('returns parsed value if key exists', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ nested: 'data' }));
      const result = await cacheStorage.get('my-key');

      expect(mockRedis.get).toHaveBeenCalledWith('my-key');
      expect(result).toEqual({ nested: 'data' });
    });

    it('returns null if key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await cacheStorage.get('my-key');

      expect(mockRedis.get).toHaveBeenCalledWith('my-key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('deletes a key from redis', async () => {
      mockRedis.del.mockResolvedValue(1);
      await cacheStorage.del('my-key');

      expect(mockRedis.del).toHaveBeenCalledWith('my-key');
    });
  });
});
