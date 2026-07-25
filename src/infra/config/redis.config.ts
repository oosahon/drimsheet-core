import IORedis from 'ioredis';
import { REDIS_URL } from './vars.config';

let redis: IORedis | undefined;
let redisPub: IORedis | undefined;
let redisSub: IORedis | undefined;
let queueConnection: IORedis | undefined;

export function getRedis(): IORedis {
  redis ??= new IORedis(REDIS_URL);
  return redis;
}

export function getRedisPublisher(): IORedis {
  redisPub ??= new IORedis(REDIS_URL);
  return redisPub;
}

export function getRedisSubscriber(): IORedis {
  redisSub ??= new IORedis(REDIS_URL);
  return redisSub;
}

export function getQueueConnection(): IORedis {
  queueConnection ??= new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  return queueConnection;
}
