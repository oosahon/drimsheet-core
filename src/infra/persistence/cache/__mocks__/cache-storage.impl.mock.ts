import { ICacheStorage } from '../../../../shared/contracts/cache-storage.contract';

export const makeMockCacheStorage = (): ICacheStorage => {
  const store = new Map<string, any>();
  return {
    get: jest.fn(async (key: string) => store.get(key) || null),
    set: jest.fn(async (key: string, value: any, ttl?: number) => {
      store.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
};
