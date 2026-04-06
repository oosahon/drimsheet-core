import IORedis from 'ioredis';
import { REDIS_URL } from './vars.config';

export const redis = new IORedis(REDIS_URL);

export const redisPub = new IORedis(REDIS_URL);
export const redisSub = new IORedis(REDIS_URL);

export const queueConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});
