import { Queue } from 'bullmq';
import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/contracts/dto/workers.dto';
import { EQueueName } from '../../../app/contracts/infra/queues.contract';
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
