import { ICacheStorage } from '@shared/contracts/cache-storage.contract';
import safeJSON from '@shared/utils/safe-json';

import { getRedis } from '@infra/config/redis.config';

const cacheStorage: ICacheStorage = {
  set: async (key, value, ttl) => {
    const stringValue = safeJSON.stringify(value);
    if (ttl) {
      await getRedis().setex(key, ttl, stringValue);
    } else {
      await getRedis().set(key, stringValue);
    }
  },

  setIfNotExists: async (key, value, ttl) => {
    const stringValue = safeJSON.stringify(value);
    const result = await getRedis().set(key, stringValue, 'EX', ttl, 'NX');
    return result === 'OK';
  },

  deleteIfValueMatches: async (key, value, additionalKeys = []) => {
    const stringValue = safeJSON.stringify(value);
    const script = `
      if redis.call('GET', KEYS[1]) ~= ARGV[1] then
        return 0
      end
      return redis.call('DEL', unpack(KEYS))
    `;
    const result = await getRedis().eval(
      script,
      1 + additionalKeys.length,
      key,
      ...additionalKeys,
      stringValue
    );
    return Number(result) > 0;
  },

  get: async (key) => {
    const result = await getRedis().get(key);
    return result ? JSON.parse(result) : null;
  },

  del: async (key: string) => {
    await getRedis().del(key);
  },
};

export default cacheStorage;
