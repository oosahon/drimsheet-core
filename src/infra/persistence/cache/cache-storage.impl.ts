import { ICacheStorage } from '../../../app/contracts/infra/cache-storage.contract';
import { redis } from '../../config/redis.config';

const cacheStorage: ICacheStorage = {
  set: async (key, value, ttl) => {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  },

  get: async (key) => {
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  },

  del: async (key: string) => {
    await redis.del(key);
  },
};

export default cacheStorage;
