import { Queue } from 'bullmq';
import { IQueue } from '../../../app/contracts/infra/queues.contract';
import { queueConnection } from '../../config/redis.config';
import reporter from '../../observability/reporter';

export const transactionalEmailQueue = new Queue('transactional-email', {
  connection: queueConnection,
  // @ts-expect-error: BullMQ types are not compatible with ioredis types
  limiter: {
    max: 100,
    duration: 1000,
  },
});

export const ledgerAccountBalanceAdjustmentQueue = new Queue(
  'ledger-account-balance-adjustment',
  {
    connection: queueConnection,
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 300,
      duration: 1000,
    },
  }
);

const queue: IQueue = {
  async addTransactionalEmail(payload) {
    try {
      return transactionalEmailQueue.add('transactional-email', payload, {
        jobId: `transactional-email_${payload.correlationId}`,
        removeOnComplete: true,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
      });
    } catch (error) {
      reporter.report(error, { job: payload });
    }
  },

  async addLedgerAccountBalanceAdjustment(payload) {
    try {
      return ledgerAccountBalanceAdjustmentQueue.add(
        'ledger-account-balance-adjustment',
        payload,
        {
          jobId: `ledger-account-balance-adjustment_${payload.newBalance.ledgerAccountId}_${payload.correlationId}`,
          removeOnComplete: false,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 50,
          },
        }
      );
    } catch (error) {
      reporter.report(error, { job: payload });
    }
  },
};

export default queue;
