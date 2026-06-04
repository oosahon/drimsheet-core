import { Queue } from 'bullmq';
import { EQueueName } from '../../../app/shared/contracts/queues.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/shared/dtos/workers.dto';
import { queueConnection } from '../../config/redis.config';

export const ledgerAccountBalanceAdjustmentQueue = new Queue(
  EQueueName.LedgerAccountBalanceAdjustment,
  {
    connection: queueConnection,
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 300,
      duration: 1000,
    },
  }
);

export function getConfig(payload: ILedgerAccountBalanceAdjustmentDto) {
  return Object.freeze({
    jobId: `${EQueueName.LedgerAccountBalanceAdjustment}_${payload.ledgerAccountId}_${payload.correlationId}`,
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 50,
    },
  });
}
