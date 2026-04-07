import { Queue } from 'bullmq';
import { queueConnection } from '../../config/redis.config';
import { IQueue } from '../../../app/contracts/infra/queues.contract';
import reporter from '../../observability/reporter';

export const transactionalEmailQueue = new Queue('transactional-email', {
  connection: queueConnection,
  // @ts-expect-error: BullMQ types are not compatible with ioredis types
  limiter: {
    max: 100,
    duration: 1000,
  },
});

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
};

export default queue;
