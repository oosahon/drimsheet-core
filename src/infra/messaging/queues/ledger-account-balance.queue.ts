import { Queue } from 'bullmq';

import IQueueMetrics, {
  EQueueTransport,
} from '@shared/contracts/queue-metrics.contract';
import IReporter from '@shared/contracts/reporter.contract';

import ILedgerBalanceAdjustmentQueue, {
  LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
} from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';

import { getQueueConnection } from '@infra/config/redis.config';

let ledgerAccountBalanceAdjustmentQueue:
  | Queue<ILedgerAccountBalanceAdjustmentDto>
  | undefined;

export function getLedgerAccountBalanceAdjustmentQueue(): Queue<ILedgerAccountBalanceAdjustmentDto> {
  ledgerAccountBalanceAdjustmentQueue ??= new Queue(
    LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
    {
      connection: getQueueConnection(),
      // @ts-expect-error: BullMQ types are not compatible with ioredis types
      limiter: {
        max: 300,
        duration: 1000,
      },
    }
  );

  return ledgerAccountBalanceAdjustmentQueue;
}

function getConfig(payload: ILedgerAccountBalanceAdjustmentDto) {
  return Object.freeze({
    jobId: `${LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME}_${payload.ledgerAccountId}_${payload.correlationId}`,
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 50,
    },
  });
}

export default function makeLedgerAccountBalanceAdjustmentQueue(
  reporter: IReporter,
  queueMetrics: IQueueMetrics
): ILedgerBalanceAdjustmentQueue {
  return {
    async add(payload) {
      try {
        await getLedgerAccountBalanceAdjustmentQueue().add(
          LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
          payload,
          getConfig(payload)
        );
        queueMetrics.recordEnqueueSucceeded({
          queueName: LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
          transport: EQueueTransport.BullMQ,
        });
      } catch (error) {
        queueMetrics.recordEnqueueFailed({
          queueName: LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
          transport: EQueueTransport.BullMQ,
        });
        // NB: we are intentionally not rethrowing this error because
        // failure to add to balance adjustment to queue should not cause the
        // journal entry to fail. The source of truth is still the journal entry, this can
        // always be eventually consistent.
        reporter.report('queue.job.enqueue_failed', error, {
          queue: LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
          transport: EQueueTransport.BullMQ,
        });
      }
    },
  };
}
