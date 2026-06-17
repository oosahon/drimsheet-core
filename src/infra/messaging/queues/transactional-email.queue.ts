import { Queue } from 'bullmq';
import ITransactionalEmailQueue, {
  TRANSACTIONAL_EMAIL_QUEUE_NAME,
} from '../../../app/notification/contracts/transactional-email-queue.contract';
import { ITransactionalEmailDto } from '../../../app/notification/dtos/transactional-email.dto';
import IReporter from '../../../shared/contracts/reporter.contract';
import { queueConnection } from '../../config/redis.config';

export const transactionalEmailQueue = new Queue(
  TRANSACTIONAL_EMAIL_QUEUE_NAME,
  {
    connection: queueConnection,
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

function getConfig(payload: ITransactionalEmailDto) {
  return Object.freeze({
    jobId: `${TRANSACTIONAL_EMAIL_QUEUE_NAME}_${payload.correlationId}`,
    removeOnComplete: true,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
  });
}

export default function makeTransactionalEmailQueue(
  reporter: IReporter
): ITransactionalEmailQueue {
  return {
    async add(payload) {
      try {
        await transactionalEmailQueue.add(
          TRANSACTIONAL_EMAIL_QUEUE_NAME,
          payload,
          getConfig(payload)
        );
      } catch (error) {
        reporter.report(error, { job: payload });
      }
    },
  };
}
