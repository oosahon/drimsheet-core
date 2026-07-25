import { ICacheStorage } from '../cache-storage.contract';

export const makeMockCacheStorage = (): ICacheStorage => {
  const store = new Map<string, any>();
  return {
    get: jest.fn(async (key: string) => store.get(key) || null),
    set: jest.fn(async (key: string, value: any, ttl?: number) => {
      store.set(key, value);
    }),
    setIfNotExists: jest.fn(async (key: string, value: any, ttl: number) => {
      if (store.has(key)) return false;
      store.set(key, value);
      return true;
    }),
    deleteIfValueMatches: jest.fn(
      async (key: string, value: any, additionalKeys: string[] = []) => {
        if (store.get(key) !== value) return false;
        store.delete(key);
        additionalKeys.forEach((additionalKey) => store.delete(additionalKey));
        return true;
      }
    ),
    del: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
};
