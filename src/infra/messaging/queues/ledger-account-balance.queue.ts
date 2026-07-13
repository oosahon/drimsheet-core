import { Queue } from 'bullmq';
import ILedgerBalanceAdjustmentQueue, {
  LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
} from '../../../app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../../app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import IReporter from '../../../shared/contracts/reporter.contract';
import { queueConnection } from '../../config/redis.config';

export const ledgerAccountBalanceAdjustmentQueue = new Queue(
  LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
  {
    connection: queueConnection,
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 300,
      duration: 1000,
    },
  }
);

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
  reporter: IReporter
): ILedgerBalanceAdjustmentQueue {
  return {
    async add(payload) {
      try {
        await ledgerAccountBalanceAdjustmentQueue.add(
          LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME,
          payload,
          getConfig(payload)
        );
      } catch (error) {
        reporter.report(error, { job: payload });
      }
    },
  };
}
