import { Queue } from 'bullmq';
import { EQueueName } from '../../../app/shared/contracts/queues.contract';
import { ITransactionalEmailDto } from '../../../app/shared/dtos/workers.dto';
import { queueConnection } from '../../config/redis.config';

export const transactionalEmailQueue = new Queue(
  EQueueName.TransactionalEmail,
  {
    connection: queueConnection,
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

export function getConfig(payload: ITransactionalEmailDto) {
  return Object.freeze({
    jobId: `${EQueueName.TransactionalEmail}_${payload.correlationId}`,
    removeOnComplete: true,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
  });
}
